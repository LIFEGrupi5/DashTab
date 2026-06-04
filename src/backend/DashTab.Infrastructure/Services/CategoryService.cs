using DashTab.Application.Dtos;
using DashTab.Application.Interfaces;
using DashTab.Application.Mappings;
using DashTab.Domain.Entities;
using DashTab.Infrastructure.Caching;
using DashTab.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace DashTab.Infrastructure.Services;

public class CategoryService(
    DashTabDbContext db,
    ICacheService cache,
    MenuCategoryMapper mapper,
    ICurrentUser currentUser) : ICategoryService
{
    private static readonly TimeSpan CategoryTtl = TimeSpan.FromMinutes(15);

    public async Task<IEnumerable<MenuCategoryDto>> ListAsync()
    {
        var key = CacheKeys.MenuCategoriesAll(currentUser.RestaurantId);
        var cached = await cache.GetAsync<List<MenuCategoryDto>>(key);
        if (cached is not null) return cached;

        var cats = await db.MenuCategories.OrderBy(c => c.DisplayOrder).ToListAsync();
        var dtos = cats.Select(mapper.ToDto).ToList();

        await cache.SetAsync(key, dtos, CategoryTtl);
        return dtos;
    }

    public async Task<MenuCategoryDto?> GetByIdAsync(Guid id)
    {
        var key = CacheKeys.MenuCategory(currentUser.RestaurantId, id);
        var cached = await cache.GetAsync<MenuCategoryDto>(key);
        if (cached is not null) return cached;

        var cat = await db.MenuCategories.FindAsync(id);
        if (cat is null) return null;

        var dto = mapper.ToDto(cat);
        await cache.SetAsync(key, dto, CategoryTtl);
        return dto;
    }

    public async Task<MenuCategoryDto> CreateAsync(CreateCategoryRequest request)
    {
        var now = DateTime.UtcNow;
        var cat = mapper.ToEntity(request);
        cat.Id = Guid.NewGuid();
        cat.IsDeleted = false;
        cat.CreatedAt = now;
        cat.UpdatedAt = now;
        cat.RestaurantId = currentUser.RestaurantId;
        db.MenuCategories.Add(cat);
        await db.SaveChangesAsync();

        await cache.RemoveAsync(CacheKeys.MenuCategoriesAll(currentUser.RestaurantId));

        return mapper.ToDto(cat);
    }

    public async Task<MenuCategoryDto?> UpdateAsync(Guid id, UpdateCategoryRequest request)
    {
        var cat = await db.MenuCategories.FindAsync(id);
        if (cat is null) return null;

        mapper.Update(request, cat);
        cat.UpdatedAt = DateTime.UtcNow;
        await db.SaveChangesAsync();

        var rid = currentUser.RestaurantId;
        await cache.RemoveManyAsync(new[]
        {
            CacheKeys.MenuCategoriesAll(rid),
            CacheKeys.MenuCategory(rid, id),
            CacheKeys.MenuItemsAll(rid),
            CacheKeys.MenuItemsByCategory(rid, id),
        });

        return mapper.ToDto(cat);
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

        var rid = currentUser.RestaurantId;
        await cache.RemoveManyAsync(new[]
        {
            CacheKeys.MenuCategoriesAll(rid),
            CacheKeys.MenuCategory(rid, id),
        });

        return true;
    }
}
