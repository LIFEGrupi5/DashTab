using DashTab.Application.Dtos;
using DashTab.Application.Interfaces;
using DashTab.Application.Mappings;
using DashTab.Domain.Entities;
using DashTab.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace DashTab.Infrastructure.Services;

public class MenuItemService(DashTabDbContext db, MenuItemMapper mapper) : IMenuItemService
{
    public async Task<IEnumerable<MenuItemDto>> ListAsync(Guid? categoryId = null, string? search = null, bool? available = null)
    {
        var query = db.MenuItems.Include(m => m.Category).AsQueryable();

        if (categoryId.HasValue)
            query = query.Where(m => m.CategoryId == categoryId.Value);
        if (!string.IsNullOrWhiteSpace(search))
            query = query.Where(m => m.Name.ToLower().Contains(search.ToLower()));
        if (available.HasValue)
            query = query.Where(m => m.IsAvailable == available.Value);

        var items = await query
            .OrderBy(m => m.Category.DisplayOrder)
            .ThenBy(m => m.Name)
            .ToListAsync();

        return items.Select(mapper.ToDto);
    }

    public async Task<MenuItemDto?> GetByIdAsync(Guid id)
    {
        var item = await db.MenuItems.Include(m => m.Category).FirstOrDefaultAsync(m => m.Id == id);
        return item is null ? null : mapper.ToDto(item);
    }

    public async Task<MenuItemDto> CreateAsync(CreateMenuItemRequest request)
    {
        var now = DateTime.UtcNow;
        var item = mapper.ToEntity(request);
        item.Id = Guid.NewGuid();
        item.CreatedAt = now;
        item.UpdatedAt = now;
        db.MenuItems.Add(item);
        await db.SaveChangesAsync();
        await db.Entry(item).Reference(m => m.Category).LoadAsync();
        return mapper.ToDto(item);
    }

    public async Task<MenuItemDto?> UpdateAsync(Guid id, UpdateMenuItemRequest request)
    {
        var item = await db.MenuItems.Include(m => m.Category).FirstOrDefaultAsync(m => m.Id == id);
        if (item is null) return null;

        mapper.Update(request, item);
        item.UpdatedAt = DateTime.UtcNow;
        await db.SaveChangesAsync();

        if (item.Category.Id != request.CategoryId)
            await db.Entry(item).Reference(m => m.Category).LoadAsync();

        return mapper.ToDto(item);
    }

    public async Task<MenuItemDto?> ToggleAvailabilityAsync(Guid id, bool available)
    {
        var item = await db.MenuItems.Include(m => m.Category).FirstOrDefaultAsync(m => m.Id == id);
        if (item is null) return null;

        item.IsAvailable = available;
        item.UpdatedAt = DateTime.UtcNow;
        await db.SaveChangesAsync();
        return mapper.ToDto(item);
    }

    public async Task<bool> DeleteAsync(Guid id)
    {
        var item = await db.MenuItems.FindAsync(id);
        if (item is null) return false;

        item.IsDeleted = true;
        item.UpdatedAt = DateTime.UtcNow;
        await db.SaveChangesAsync();
        return true;
    }
}
