using DashTab.Application.Dtos;
using DashTab.Application.Interfaces;
using DashTab.Application.Mappings;
using DashTab.Domain.Entities;
using DashTab.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace DashTab.Infrastructure.Services;

public class CategoryService(DashTabDbContext db, MenuCategoryMapper mapper) : ICategoryService
{
    public async Task<IEnumerable<MenuCategoryDto>> ListAsync()
    {
        var cats = await db.MenuCategories.OrderBy(c => c.DisplayOrder).ToListAsync();
        return cats.Select(mapper.ToDto);
    }

    public async Task<MenuCategoryDto?> GetByIdAsync(Guid id)
    {
        var cat = await db.MenuCategories.FindAsync(id);
        return cat is null ? null : mapper.ToDto(cat);
    }

    public async Task<MenuCategoryDto> CreateAsync(CreateCategoryRequest request)
    {
        var now = DateTime.UtcNow;
        var cat = mapper.ToEntity(request);
        cat.Id = Guid.NewGuid();
        cat.CreatedAt = now;
        cat.UpdatedAt = now;
        db.MenuCategories.Add(cat);
        await db.SaveChangesAsync();
        return mapper.ToDto(cat);
    }

    public async Task<MenuCategoryDto?> UpdateAsync(Guid id, UpdateCategoryRequest request)
    {
        var cat = await db.MenuCategories.FindAsync(id);
        if (cat is null) return null;

        mapper.Update(request, cat);
        cat.UpdatedAt = DateTime.UtcNow;
        await db.SaveChangesAsync();
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
        return true;
    }
}
