using DashTab.Application.Dtos;
using DashTab.Application.Interfaces;
using DashTab.Application.Mappings;
using DashTab.Domain.Entities;
using DashTab.Infrastructure.Caching;
using DashTab.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace DashTab.Infrastructure.Services;

public class MenuItemService(DashTabDbContext db, ICacheService cache, MenuItemMapper mapper) : IMenuItemService
{
    private static readonly TimeSpan ItemTtl = TimeSpan.FromMinutes(5);

    public async Task<IEnumerable<MenuItemDto>> ListAsync(Guid? categoryId = null, string? search = null, bool? available = null)
    {
        var canCache = string.IsNullOrWhiteSpace(search) && !available.HasValue;
        var cacheKey = categoryId.HasValue
            ? CacheKeys.MenuItemsByCategory(categoryId.Value)
            : CacheKeys.MenuItemsAll;

        if (canCache)
        {
            var cached = await cache.GetAsync<List<MenuItemDto>>(cacheKey);
            if (cached is not null) return cached;
        }

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

        var dtos = items.Select(mapper.ToDto).ToList();

        if (canCache)
            await cache.SetAsync(cacheKey, dtos, ItemTtl);

        return dtos;
    }

    public async Task<MenuItemDto?> GetByIdAsync(Guid id)
    {
        var key = CacheKeys.MenuItem(id);
        var cached = await cache.GetAsync<MenuItemDto>(key);
        if (cached is not null) return cached;

        var item = await db.MenuItems.Include(m => m.Category).FirstOrDefaultAsync(m => m.Id == id);
        if (item is null) return null;

        var dto = mapper.ToDto(item);
        await cache.SetAsync(key, dto, ItemTtl);
        return dto;
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

        await cache.RemoveManyAsync(new[]
        {
            CacheKeys.MenuItemsAll,
            CacheKeys.MenuItemsByCategory(item.CategoryId)
        });

        return mapper.ToDto(item);
    }

    public async Task<MenuItemDto?> UpdateAsync(Guid id, UpdateMenuItemRequest request)
    {
        var item = await db.MenuItems.Include(m => m.Category).FirstOrDefaultAsync(m => m.Id == id);
        if (item is null) return null;

        var oldCategoryId = item.CategoryId;

        mapper.Update(request, item);
        item.UpdatedAt = DateTime.UtcNow;
        await db.SaveChangesAsync();

        if (item.Category.Id != request.CategoryId)
            await db.Entry(item).Reference(m => m.Category).LoadAsync();

        var keys = new List<string>
        {
            CacheKeys.MenuItemsAll,
            CacheKeys.MenuItem(id),
            CacheKeys.MenuItemsByCategory(item.CategoryId)
        };
        if (oldCategoryId != item.CategoryId)
            keys.Add(CacheKeys.MenuItemsByCategory(oldCategoryId));
        await cache.RemoveManyAsync(keys);

        return mapper.ToDto(item);
    }

    public async Task<MenuItemDto?> ToggleAvailabilityAsync(Guid id, bool available)
    {
        var item = await db.MenuItems.Include(m => m.Category).FirstOrDefaultAsync(m => m.Id == id);
        if (item is null) return null;

        item.IsAvailable = available;
        item.UpdatedAt = DateTime.UtcNow;
        await db.SaveChangesAsync();

        await cache.RemoveManyAsync(new[]
        {
            CacheKeys.MenuItemsAll,
            CacheKeys.MenuItemsByCategory(item.CategoryId),
            CacheKeys.MenuItem(id)
        });

        return mapper.ToDto(item);
    }

    public async Task<bool> DeleteAsync(Guid id)
    {
        var item = await db.MenuItems.FindAsync(id);
        if (item is null) return false;

        item.IsDeleted = true;
        item.UpdatedAt = DateTime.UtcNow;
        await db.SaveChangesAsync();

        await cache.RemoveManyAsync(new[]
        {
            CacheKeys.MenuItemsAll,
            CacheKeys.MenuItemsByCategory(item.CategoryId),
            CacheKeys.MenuItem(id)
        });

        return true;
    }
}
