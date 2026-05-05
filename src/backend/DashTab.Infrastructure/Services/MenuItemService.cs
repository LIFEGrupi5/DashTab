using DashTab.Application.Dtos;
using DashTab.Application.Interfaces;
using DashTab.Domain.Entities;
using DashTab.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace DashTab.Infrastructure.Services;

public class MenuItemService(AppDbContext db) : IMenuItemService
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

        return items.Select(ToDto);
    }

    public async Task<MenuItemDto?> GetByIdAsync(Guid id)
    {
        var item = await db.MenuItems.Include(m => m.Category).FirstOrDefaultAsync(m => m.Id == id);
        return item is null ? null : ToDto(item);
    }

    public async Task<MenuItemDto> CreateAsync(CreateMenuItemRequest request)
    {
        var now = DateTime.UtcNow;
        var item = new MenuItem
        {
            Id = Guid.NewGuid(),
            CategoryId = request.CategoryId,
            Name = request.Name,
            Description = request.Description,
            Price = request.Price,
            IsAvailable = request.Available,
            CreatedAt = now,
            UpdatedAt = now,
        };
        db.MenuItems.Add(item);
        await db.SaveChangesAsync();
        await db.Entry(item).Reference(m => m.Category).LoadAsync();
        return ToDto(item);
    }

    public async Task<MenuItemDto?> UpdateAsync(Guid id, UpdateMenuItemRequest request)
    {
        var item = await db.MenuItems.Include(m => m.Category).FirstOrDefaultAsync(m => m.Id == id);
        if (item is null) return null;

        item.Name = request.Name;
        item.CategoryId = request.CategoryId;
        item.Description = request.Description;
        item.Price = request.Price;
        item.IsAvailable = request.Available;
        item.UpdatedAt = DateTime.UtcNow;
        await db.SaveChangesAsync();

        if (item.Category.Id != request.CategoryId)
            await db.Entry(item).Reference(m => m.Category).LoadAsync();

        return ToDto(item);
    }

    public async Task<MenuItemDto?> ToggleAvailabilityAsync(Guid id, bool available)
    {
        var item = await db.MenuItems.Include(m => m.Category).FirstOrDefaultAsync(m => m.Id == id);
        if (item is null) return null;

        item.IsAvailable = available;
        item.UpdatedAt = DateTime.UtcNow;
        await db.SaveChangesAsync();
        return ToDto(item);
    }

    public async Task<bool> DeleteAsync(Guid id)
    {
        var item = await db.MenuItems.FindAsync(id);
        if (item is null) return false;

        db.MenuItems.Remove(item);
        await db.SaveChangesAsync();
        return true;
    }

    private static MenuItemDto ToDto(MenuItem m) =>
        new(m.Id, m.Name, m.Category.Name, m.Price, m.Description, m.IsAvailable);
}
