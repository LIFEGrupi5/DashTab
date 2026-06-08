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

public class CreateMenuItemHandler(
    DashTabDbContext db,
    ICacheService cache,
    MenuItemMapper mapper,
    IStorageService storage,
    ICurrentUser currentUser) : IRequestHandler<CreateMenuItemCommand, MenuItemDto>
{
    public async Task<MenuItemDto> Handle(CreateMenuItemCommand command, CancellationToken cancellationToken)
    {
        var now = DateTime.UtcNow;
        var item = mapper.ToEntity(command.Request);
        item.Id = Guid.NewGuid();
        item.CreatedAt = now;
        item.UpdatedAt = now;
        item.RestaurantId = currentUser.RestaurantId;
        db.MenuItems.Add(item);
        await db.SaveChangesAsync(cancellationToken);
        await db.Entry(item).Reference(m => m.Category).LoadAsync(cancellationToken);

        var rid = currentUser.RestaurantId;
        await cache.RemoveManyAsync(new[]
        {
            CacheKeys.MenuItemsAll(rid),
            CacheKeys.MenuItemsByCategory(rid, item.CategoryId),
        });

        return MenuItemDtoMapper.ToDto(item, mapper, storage);
    }
}

public class UpdateMenuItemHandler(
    DashTabDbContext db,
    ICacheService cache,
    MenuItemMapper mapper,
    IStorageService storage,
    ICurrentUser currentUser) : IRequestHandler<UpdateMenuItemCommand, MenuItemDto?>
{
    public async Task<MenuItemDto?> Handle(UpdateMenuItemCommand command, CancellationToken cancellationToken)
    {
        var item = await db.MenuItems.Include(m => m.Category)
            .FirstOrDefaultAsync(m => m.Id == command.Id, cancellationToken);
        if (item is null) return null;

        var oldCategoryId = item.CategoryId;

        mapper.Update(command.Request, item);
        item.UpdatedAt = DateTime.UtcNow;
        await db.SaveChangesAsync(cancellationToken);

        if (item.Category.Id != command.Request.CategoryId)
            await db.Entry(item).Reference(m => m.Category).LoadAsync(cancellationToken);

        var rid = currentUser.RestaurantId;
        var keys = new List<string>
        {
            CacheKeys.MenuItemsAll(rid),
            CacheKeys.MenuItem(rid, command.Id),
            CacheKeys.MenuItemsByCategory(rid, item.CategoryId),
        };
        if (oldCategoryId != item.CategoryId)
            keys.Add(CacheKeys.MenuItemsByCategory(rid, oldCategoryId));
        await cache.RemoveManyAsync(keys);

        return MenuItemDtoMapper.ToDto(item, mapper, storage);
    }
}

public class ToggleMenuItemAvailabilityHandler(
    DashTabDbContext db,
    ICacheService cache,
    MenuItemMapper mapper,
    IStorageService storage,
    ICurrentUser currentUser) : IRequestHandler<ToggleMenuItemAvailabilityCommand, MenuItemDto?>
{
    public async Task<MenuItemDto?> Handle(ToggleMenuItemAvailabilityCommand command, CancellationToken cancellationToken)
    {
        var item = await db.MenuItems.Include(m => m.Category)
            .FirstOrDefaultAsync(m => m.Id == command.Id, cancellationToken);
        if (item is null) return null;

        item.IsAvailable = command.Available;
        item.UpdatedAt = DateTime.UtcNow;
        await db.SaveChangesAsync(cancellationToken);

        var rid = currentUser.RestaurantId;
        await cache.RemoveManyAsync(new[]
        {
            CacheKeys.MenuItemsAll(rid),
            CacheKeys.MenuItemsByCategory(rid, item.CategoryId),
            CacheKeys.MenuItem(rid, command.Id),
        });

        return MenuItemDtoMapper.ToDto(item, mapper, storage);
    }
}

public class DeleteMenuItemHandler(
    DashTabDbContext db,
    ICacheService cache,
    IStorageService storage,
    ICurrentUser currentUser) : IRequestHandler<DeleteMenuItemCommand, bool>
{
    public async Task<bool> Handle(DeleteMenuItemCommand command, CancellationToken cancellationToken)
    {
        var item = await db.MenuItems.FirstOrDefaultAsync(m => m.Id == command.Id, cancellationToken);
        if (item is null) return false;

        if (item.ImageObjectKey is not null)
        {
            await storage.DeleteAsync(StorageBuckets.MenuImages, item.ImageObjectKey);
            item.ImageObjectKey = null;
        }

        item.IsDeleted = true;
        item.UpdatedAt = DateTime.UtcNow;
        await db.SaveChangesAsync(cancellationToken);

        var rid = currentUser.RestaurantId;
        await cache.RemoveManyAsync(new[]
        {
            CacheKeys.MenuItemsAll(rid),
            CacheKeys.MenuItemsByCategory(rid, item.CategoryId),
            CacheKeys.MenuItem(rid, command.Id),
        });

        return true;
    }
}
