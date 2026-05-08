using DashTab.Application.Dtos;
using DashTab.Application.Interfaces;
using DashTab.Domain.Entities;
using DashTab.Infrastructure.Caching;
using DashTab.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace DashTab.Infrastructure.Services;

public class CategoryService(DashTabDbContext db, ICacheService cache) : ICategoryService
{
    private static readonly TimeSpan CategoryTtl = TimeSpan.FromMinutes(15);

    public async Task<IEnumerable<MenuCategoryDto>> ListAsync()
    {
        var cached = await cache.GetAsync<List<MenuCategoryDto>>(CacheKeys.MenuCategoriesAll);
        if (cached is not null) return cached;

        var cats = await db.MenuCategories.OrderBy(c => c.DisplayOrder).ToListAsync();
        var dtos = cats.Select(ToDto).ToList();

        await cache.SetAsync(CacheKeys.MenuCategoriesAll, dtos, CategoryTtl);
        return dtos;
    }

    public async Task<MenuCategoryDto?> GetByIdAsync(Guid id)
    {
        var key = CacheKeys.MenuCategory(id);
        var cached = await cache.GetAsync<MenuCategoryDto>(key);
        if (cached is not null) return cached;

        var cat = await db.MenuCategories.FindAsync(id);
        if (cat is null) return null;

        var dto = ToDto(cat);
        await cache.SetAsync(key, dto, CategoryTtl);
        return dto;
    }

    public async Task<MenuCategoryDto> CreateAsync(CreateCategoryRequest request)
    {
        var now = DateTime.UtcNow;
        var cat = new MenuCategory
        {
            Id = Guid.NewGuid(),
            Name = request.Name,
            DisplayOrder = request.DisplayOrder,
            CreatedAt = now,
            UpdatedAt = now,
        };
        db.MenuCategories.Add(cat);
        await db.SaveChangesAsync();

        await cache.RemoveAsync(CacheKeys.MenuCategoriesAll);

        return ToDto(cat);
    }

    public async Task<MenuCategoryDto?> UpdateAsync(Guid id, UpdateCategoryRequest request)
    {
        var cat = await db.MenuCategories.FindAsync(id);
        if (cat is null) return null;

        cat.Name = request.Name;
        cat.DisplayOrder = request.DisplayOrder;
        cat.UpdatedAt = DateTime.UtcNow;
        await db.SaveChangesAsync();

        // MenuItemDto.Category is the denormalized name — invalidate item caches too.
        await cache.RemoveManyAsync(new[]
        {
            CacheKeys.MenuCategoriesAll,
            CacheKeys.MenuCategory(id),
            CacheKeys.MenuItemsAll,
            CacheKeys.MenuItemsByCategory(id)
        });

        return ToDto(cat);
    }

    public async Task<bool> DeleteAsync(Guid id)
    {
        var cat = await db.MenuCategories.FindAsync(id);
        if (cat is null) return false;

        var hasItems = await db.MenuItems.AnyAsync(m => m.CategoryId == id);
        if (hasItems)
            throw new InvalidOperationException("Cannot delete a category that still has menu items.");

        cat.IsDeleted = true;
        cat.UpdatedAt = DateTime.UtcNow;
        await db.SaveChangesAsync();

        await cache.RemoveManyAsync(new[]
        {
            CacheKeys.MenuCategoriesAll,
            CacheKeys.MenuCategory(id)
        });

        return true;
    }

    private static MenuCategoryDto ToDto(MenuCategory c) => new(c.Id, c.Name, c.DisplayOrder);
}
