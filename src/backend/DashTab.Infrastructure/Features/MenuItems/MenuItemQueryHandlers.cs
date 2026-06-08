using DashTab.Application.Dtos;
using DashTab.Application.Features.MenuItems.Queries;
using DashTab.Application.Interfaces;
using DashTab.Application.Mappings;
using DashTab.Infrastructure.Caching;
using DashTab.Infrastructure.Persistence;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace DashTab.Infrastructure.Features.MenuItems;

public class ListMenuItemsHandler(
    DashTabDbContext db,
    ICacheService cache,
    MenuItemMapper mapper,
    IStorageService storage,
    ICurrentUser currentUser) : IRequestHandler<ListMenuItemsQuery, PagedResult<MenuItemDto>>
{
    private static readonly TimeSpan ItemTtl = TimeSpan.FromMinutes(5);

    public async Task<PagedResult<MenuItemDto>> Handle(ListMenuItemsQuery request, CancellationToken cancellationToken)
    {
        var rid = currentUser.RestaurantId;
        var canCache = string.IsNullOrWhiteSpace(request.Search) && !request.Available.HasValue;
        var cacheKey = request.CategoryId.HasValue
            ? CacheKeys.MenuItemsByCategory(rid, request.CategoryId.Value)
            : CacheKeys.MenuItemsAll(rid);

        if (canCache)
        {
            var cached = await cache.GetAsync<List<MenuItemDto>>(cacheKey);
            if (cached is not null)
                return new PagedResult<MenuItemDto>(
                    cached.Skip(request.Skip).Take(request.Take), cached.Count, request.Skip, request.Take);
        }

        var query = db.MenuItems.Include(m => m.Category).AsQueryable();

        if (request.CategoryId.HasValue)
            query = query.Where(m => m.CategoryId == request.CategoryId.Value);
        if (!string.IsNullOrWhiteSpace(request.Search))
            query = query.Where(m => m.Name.ToLower().Contains(request.Search.ToLower()));
        if (request.Available.HasValue)
            query = query.Where(m => m.IsAvailable == request.Available.Value);

        var ordered = query.OrderBy(m => m.Category.DisplayOrder).ThenBy(m => m.Name);
        var total = await ordered.CountAsync(cancellationToken);
        var items = await ordered.Skip(request.Skip).Take(request.Take).ToListAsync(cancellationToken);
        var dtos = items.Select(i => MenuItemDtoMapper.ToDto(i, mapper, storage)).ToList();

        if (canCache && request.Skip == 0 && request.Take >= total)
            await cache.SetAsync(cacheKey, dtos, ItemTtl);

        return new PagedResult<MenuItemDto>(dtos, total, request.Skip, request.Take);
    }
}

public class GetMenuItemByIdHandler(
    DashTabDbContext db,
    ICacheService cache,
    MenuItemMapper mapper,
    IStorageService storage,
    ICurrentUser currentUser) : IRequestHandler<GetMenuItemByIdQuery, MenuItemDto?>
{
    private static readonly TimeSpan ItemTtl = TimeSpan.FromMinutes(5);

    public async Task<MenuItemDto?> Handle(GetMenuItemByIdQuery request, CancellationToken cancellationToken)
    {
        var key = CacheKeys.MenuItem(currentUser.RestaurantId, request.Id);
        var cached = await cache.GetAsync<MenuItemDto>(key);
        if (cached is not null) return cached;

        var item = await db.MenuItems.Include(m => m.Category)
            .FirstOrDefaultAsync(m => m.Id == request.Id, cancellationToken);
        if (item is null) return null;

        var dto = MenuItemDtoMapper.ToDto(item, mapper, storage);
        await cache.SetAsync(key, dto, ItemTtl);
        return dto;
    }
}
