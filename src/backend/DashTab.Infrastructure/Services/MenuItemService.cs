using DashTab.Application.Dtos;
using DashTab.Application.Interfaces;
using DashTab.Application.Mappings;
using DashTab.Application.Storage;
using DashTab.Domain.Entities;
using DashTab.Infrastructure.Caching;
using DashTab.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace DashTab.Infrastructure.Services;

public class MenuItemService(
    DashTabDbContext db,
    ICacheService cache,
    MenuItemMapper mapper,
    IStorageService storage,
    ICurrentUser currentUser) : IMenuItemService
{
    private static readonly TimeSpan ItemTtl = TimeSpan.FromMinutes(5);

    private MenuItemDto ToDto(MenuItem item) =>
        mapper.ToDto(item) with
        {
            ImageUrl = item.ImageObjectKey is null
                ? null
                : storage.GetPublicUrl(StorageBuckets.MenuImages, item.ImageObjectKey)
        };

    public async Task<PagedResult<MenuItemDto>> ListAsync(Guid? categoryId = null, string? search = null, bool? available = null, int skip = 0, int take = 50)
    {
        var rid = currentUser.RestaurantId;
        var canCache = string.IsNullOrWhiteSpace(search) && !available.HasValue;
        var cacheKey = categoryId.HasValue
            ? CacheKeys.MenuItemsByCategory(rid, categoryId.Value)
            : CacheKeys.MenuItemsAll(rid);

        // Cache stores the full ordered list; pagination is applied in-memory after
        // the cache read so we don't need a separate entry per skip/take combination.
        if (canCache)
        {
            var cached = await cache.GetAsync<List<MenuItemDto>>(cacheKey);
            if (cached is not null)
                return new PagedResult<MenuItemDto>(cached.Skip(skip).Take(take), cached.Count, skip, take);
        }

        var query = db.MenuItems.Include(m => m.Category).AsQueryable();

        if (categoryId.HasValue)
            query = query.Where(m => m.CategoryId == categoryId.Value);
        if (!string.IsNullOrWhiteSpace(search))
            query = query.Where(m => m.Name.ToLower().Contains(search.ToLower()));
        if (available.HasValue)
            query = query.Where(m => m.IsAvailable == available.Value);

        var ordered = query.OrderBy(m => m.Category.DisplayOrder).ThenBy(m => m.Name);
        var total = await ordered.CountAsync();
        var items = await ordered.Skip(skip).Take(take).ToListAsync();
        var dtos = items.Select(ToDto).ToList();

        if (canCache && skip == 0 && take >= total)
            await cache.SetAsync(cacheKey, dtos, ItemTtl);

        return new PagedResult<MenuItemDto>(dtos, total, skip, take);
    }

    public async Task<MenuItemDto?> GetByIdAsync(Guid id)
    {
        var key = CacheKeys.MenuItem(currentUser.RestaurantId, id);
        var cached = await cache.GetAsync<MenuItemDto>(key);
        if (cached is not null) return cached;

        var item = await db.MenuItems.Include(m => m.Category).FirstOrDefaultAsync(m => m.Id == id);
        if (item is null) return null;

        var dto = ToDto(item);
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
        item.RestaurantId = currentUser.RestaurantId;
        db.MenuItems.Add(item);
        await db.SaveChangesAsync();
        await db.Entry(item).Reference(m => m.Category).LoadAsync();

        var rid = currentUser.RestaurantId;
        await cache.RemoveManyAsync(new[]
        {
            CacheKeys.MenuItemsAll(rid),
            CacheKeys.MenuItemsByCategory(rid, item.CategoryId),
        });

        return ToDto(item);
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

        var rid = currentUser.RestaurantId;
        var keys = new List<string>
        {
            CacheKeys.MenuItemsAll(rid),
            CacheKeys.MenuItem(rid, id),
            CacheKeys.MenuItemsByCategory(rid, item.CategoryId),
        };
        if (oldCategoryId != item.CategoryId)
            keys.Add(CacheKeys.MenuItemsByCategory(rid, oldCategoryId));
        await cache.RemoveManyAsync(keys);

        return ToDto(item);
    }

    public async Task<MenuItemDto?> ToggleAvailabilityAsync(Guid id, bool available)
    {
        var item = await db.MenuItems.Include(m => m.Category).FirstOrDefaultAsync(m => m.Id == id);
        if (item is null) return null;

        item.IsAvailable = available;
        item.UpdatedAt = DateTime.UtcNow;
        await db.SaveChangesAsync();

        var rid = currentUser.RestaurantId;
        await cache.RemoveManyAsync(new[]
        {
            CacheKeys.MenuItemsAll(rid),
            CacheKeys.MenuItemsByCategory(rid, item.CategoryId),
            CacheKeys.MenuItem(rid, id),
        });

        return ToDto(item);
    }

    public async Task<bool> DeleteAsync(Guid id)
    {
        var item = await db.MenuItems.FirstOrDefaultAsync(m => m.Id == id);
        if (item is null) return false;

        if (item.ImageObjectKey is not null)
        {
            await storage.DeleteAsync(StorageBuckets.MenuImages, item.ImageObjectKey);
            item.ImageObjectKey = null;
        }

        item.IsDeleted = true;
        item.UpdatedAt = DateTime.UtcNow;
        await db.SaveChangesAsync();

        var rid = currentUser.RestaurantId;
        await cache.RemoveManyAsync(new[]
        {
            CacheKeys.MenuItemsAll(rid),
            CacheKeys.MenuItemsByCategory(rid, item.CategoryId),
            CacheKeys.MenuItem(rid, id),
        });

        return true;
    }

    public async Task<PresignedUploadUrl?> RequestImageUploadAsync(Guid id, string fileExtension, CancellationToken ct = default)
    {
        var contentType = ImagePolicy.ResolveContentType(fileExtension)
            ?? throw new InvalidOperationException($"Unsupported image extension: '{fileExtension}'.");

        var exists = await db.MenuItems.AnyAsync(m => m.Id == id, ct);
        if (!exists) return null;

        var ext = fileExtension.TrimStart('.').ToLowerInvariant();
        var objectKey = $"menu-items/{id}/{Guid.NewGuid()}.{ext}";

        return await storage.CreatePresignedUploadAsync(
            StorageBuckets.MenuImages, objectKey, TimeSpan.FromMinutes(15), contentType, ct);
    }

    public async Task<MenuItemDto?> ConfirmImageAsync(Guid id, string objectKey, CancellationToken ct = default)
    {
        if (!objectKey.StartsWith($"menu-items/{id}/", StringComparison.Ordinal))
            return null;

        var item = await db.MenuItems.Include(m => m.Category).FirstOrDefaultAsync(m => m.Id == id, ct);
        if (item is null) return null;

        var stat = await storage.StatAsync(StorageBuckets.MenuImages, objectKey, ct);
        if (stat is null) return null;

        if (stat.Size > ImagePolicy.MaxBytes)
        {
            await storage.DeleteAsync(StorageBuckets.MenuImages, objectKey, ct);
            throw new InvalidOperationException(
                $"Image exceeds maximum size of {ImagePolicy.MaxBytes / (1024 * 1024)} MB.");
        }

        if (stat.ContentType is not null && !stat.ContentType.StartsWith("image/", StringComparison.OrdinalIgnoreCase))
        {
            await storage.DeleteAsync(StorageBuckets.MenuImages, objectKey, ct);
            throw new InvalidOperationException($"Uploaded object is not an image (content-type: {stat.ContentType}).");
        }

        if (item.ImageObjectKey is not null)
            await storage.DeleteAsync(StorageBuckets.MenuImages, item.ImageObjectKey, ct);

        item.ImageObjectKey = objectKey;
        item.UpdatedAt = DateTime.UtcNow;
        await db.SaveChangesAsync(ct);

        var rid = currentUser.RestaurantId;
        await cache.RemoveManyAsync([CacheKeys.MenuItemsAll(rid), CacheKeys.MenuItem(rid, id), CacheKeys.MenuItemsByCategory(rid, item.CategoryId)]);

        return ToDto(item);
    }

    public async Task<bool> RemoveImageAsync(Guid id, CancellationToken ct = default)
    {
        var item = await db.MenuItems.FirstOrDefaultAsync(m => m.Id == id, ct);
        if (item is null) return false;
        if (item.ImageObjectKey is null) return false;

        await storage.DeleteAsync(StorageBuckets.MenuImages, item.ImageObjectKey, ct);

        item.ImageObjectKey = null;
        item.UpdatedAt = DateTime.UtcNow;
        await db.SaveChangesAsync(ct);

        var rid = currentUser.RestaurantId;
        await cache.RemoveManyAsync([CacheKeys.MenuItemsAll(rid), CacheKeys.MenuItem(rid, id), CacheKeys.MenuItemsByCategory(rid, item.CategoryId)]);

        return true;
    }
}
