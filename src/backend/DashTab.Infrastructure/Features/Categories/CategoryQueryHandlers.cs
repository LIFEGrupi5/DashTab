using DashTab.Application.Dtos;
using DashTab.Application.Features.Categories.Queries;
using DashTab.Application.Interfaces;
using DashTab.Application.Mappings;
using DashTab.Infrastructure.Caching;
using DashTab.Infrastructure.Persistence;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace DashTab.Infrastructure.Features.Categories;

public class ListCategoriesHandler(
    DashTabDbContext db,
    ICacheService cache,
    MenuCategoryMapper mapper,
    ICurrentUser currentUser) : IRequestHandler<ListCategoriesQuery, IEnumerable<MenuCategoryDto>>
{
    private static readonly TimeSpan CategoryTtl = TimeSpan.FromMinutes(15);

    public async Task<IEnumerable<MenuCategoryDto>> Handle(ListCategoriesQuery request, CancellationToken cancellationToken)
    {
        var key = CacheKeys.MenuCategoriesAll(currentUser.RestaurantId);
        var cached = await cache.GetAsync<List<MenuCategoryDto>>(key);
        if (cached is not null) return cached;

        var cats = await db.MenuCategories.OrderBy(c => c.DisplayOrder).ToListAsync(cancellationToken);
        var dtos = cats.Select(mapper.ToDto).ToList();

        await cache.SetAsync(key, dtos, CategoryTtl);
        return dtos;
    }
}

public class GetCategoryByIdHandler(
    DashTabDbContext db,
    ICacheService cache,
    MenuCategoryMapper mapper,
    ICurrentUser currentUser) : IRequestHandler<GetCategoryByIdQuery, MenuCategoryDto?>
{
    private static readonly TimeSpan CategoryTtl = TimeSpan.FromMinutes(15);

    public async Task<MenuCategoryDto?> Handle(GetCategoryByIdQuery request, CancellationToken cancellationToken)
    {
        var key = CacheKeys.MenuCategory(currentUser.RestaurantId, request.Id);
        var cached = await cache.GetAsync<MenuCategoryDto>(key);
        if (cached is not null) return cached;

        var cat = await db.MenuCategories.FirstOrDefaultAsync(c => c.Id == request.Id, cancellationToken);
        if (cat is null) return null;

        var dto = mapper.ToDto(cat);
        await cache.SetAsync(key, dto, CategoryTtl);
        return dto;
    }
}
