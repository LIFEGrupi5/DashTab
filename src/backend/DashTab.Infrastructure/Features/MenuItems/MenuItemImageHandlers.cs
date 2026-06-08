using DashTab.Application.Dtos;
using DashTab.Application.Features.MenuItems.Commands;
using DashTab.Application.Interfaces;
using DashTab.Application.Mappings;
using DashTab.Application.Storage;
using DashTab.Infrastructure.Caching;
using DashTab.Infrastructure.Persistence;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace DashTab.Infrastructure.Features.MenuItems;

public class RequestMenuItemImageUploadHandler(DashTabDbContext db, IStorageService storage)
    : IRequestHandler<RequestMenuItemImageUploadCommand, PresignedUploadUrl?>
{
    public async Task<PresignedUploadUrl?> Handle(RequestMenuItemImageUploadCommand command, CancellationToken cancellationToken)
    {
        var fileExtension = command.Request.FileExtension;
        var contentType = ImagePolicy.ResolveContentType(fileExtension)
            ?? throw new InvalidOperationException($"Unsupported image extension: '{fileExtension}'.");

        var exists = await db.MenuItems.AnyAsync(m => m.Id == command.Id, cancellationToken);
        if (!exists) return null;

        var ext = fileExtension.TrimStart('.').ToLowerInvariant();
        var objectKey = $"menu-items/{command.Id}/{Guid.NewGuid()}.{ext}";

        return await storage.CreatePresignedUploadAsync(
            StorageBuckets.MenuImages, objectKey, TimeSpan.FromMinutes(15), contentType, cancellationToken);
    }
}

public class ConfirmMenuItemImageHandler(
    DashTabDbContext db,
    ICacheService cache,
    MenuItemMapper mapper,
    IStorageService storage,
    ICurrentUser currentUser) : IRequestHandler<ConfirmMenuItemImageCommand, MenuItemDto?>
{
    public async Task<MenuItemDto?> Handle(ConfirmMenuItemImageCommand command, CancellationToken cancellationToken)
    {
        var objectKey = command.ObjectKey;
        if (!objectKey.StartsWith($"menu-items/{command.Id}/", StringComparison.Ordinal))
            return null;

        var item = await db.MenuItems.Include(m => m.Category)
            .FirstOrDefaultAsync(m => m.Id == command.Id, cancellationToken);
        if (item is null) return null;

        var stat = await storage.StatAsync(StorageBuckets.MenuImages, objectKey, cancellationToken);
        if (stat is null) return null;

        if (stat.Size > ImagePolicy.MaxBytes)
        {
            await storage.DeleteAsync(StorageBuckets.MenuImages, objectKey, cancellationToken);
            throw new InvalidOperationException(
                $"Image exceeds maximum size of {ImagePolicy.MaxBytes / (1024 * 1024)} MB.");
        }

        if (stat.ContentType is not null && !stat.ContentType.StartsWith("image/", StringComparison.OrdinalIgnoreCase))
        {
            await storage.DeleteAsync(StorageBuckets.MenuImages, objectKey, cancellationToken);
            throw new InvalidOperationException($"Uploaded object is not an image (content-type: {stat.ContentType}).");
        }

        if (item.ImageObjectKey is not null)
            await storage.DeleteAsync(StorageBuckets.MenuImages, item.ImageObjectKey, cancellationToken);

        item.ImageObjectKey = objectKey;
        item.UpdatedAt = DateTime.UtcNow;
        await db.SaveChangesAsync(cancellationToken);

        var rid = currentUser.RestaurantId;
        await cache.RemoveManyAsync([CacheKeys.MenuItemsAll(rid), CacheKeys.MenuItem(rid, command.Id), CacheKeys.MenuItemsByCategory(rid, item.CategoryId)]);

        return MenuItemDtoMapper.ToDto(item, mapper, storage);
    }
}

public class RemoveMenuItemImageHandler(
    DashTabDbContext db,
    ICacheService cache,
    IStorageService storage,
    ICurrentUser currentUser) : IRequestHandler<RemoveMenuItemImageCommand, bool>
{
    public async Task<bool> Handle(RemoveMenuItemImageCommand command, CancellationToken cancellationToken)
    {
        var item = await db.MenuItems.FirstOrDefaultAsync(m => m.Id == command.Id, cancellationToken);
        if (item is null) return false;
        if (item.ImageObjectKey is null) return false;

        await storage.DeleteAsync(StorageBuckets.MenuImages, item.ImageObjectKey, cancellationToken);

        item.ImageObjectKey = null;
        item.UpdatedAt = DateTime.UtcNow;
        await db.SaveChangesAsync(cancellationToken);

        var rid = currentUser.RestaurantId;
        await cache.RemoveManyAsync([CacheKeys.MenuItemsAll(rid), CacheKeys.MenuItem(rid, command.Id), CacheKeys.MenuItemsByCategory(rid, item.CategoryId)]);

        return true;
    }
}
