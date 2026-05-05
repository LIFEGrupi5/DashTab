using DashTab.Application.Dtos;
using DashTab.Application.Interfaces;
using DashTab.Domain.Entities;
using DashTab.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace DashTab.Infrastructure.Services;

public class CategoryService(AppDbContext db) : ICategoryService
{
    public async Task<IEnumerable<MenuCategoryDto>> ListAsync()
    {
        var cats = await db.MenuCategories.OrderBy(c => c.DisplayOrder).ToListAsync();
        return cats.Select(ToDto);
    }

    public async Task<MenuCategoryDto?> GetByIdAsync(Guid id)
    {
        var cat = await db.MenuCategories.FindAsync(id);
        return cat is null ? null : ToDto(cat);
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
        return ToDto(cat);
    }

    public async Task<bool> DeleteAsync(Guid id)
    {
        var cat = await db.MenuCategories.FindAsync(id);
        if (cat is null) return false;

        var hasItems = await db.MenuItems.AnyAsync(m => m.CategoryId == id);
        if (hasItems)
            throw new InvalidOperationException("Cannot delete a category that still has menu items.");

        db.MenuCategories.Remove(cat);
        await db.SaveChangesAsync();
        return true;
    }

    private static MenuCategoryDto ToDto(MenuCategory c) => new(c.Id, c.Name, c.DisplayOrder);
}
