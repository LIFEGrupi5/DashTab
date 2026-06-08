using DashTab.Application.Dtos;
using DashTab.Application.Features.Categories.Commands;
using DashTab.Application.Interfaces;
using DashTab.Application.Mappings;
using DashTab.Infrastructure.Caching;
using DashTab.Infrastructure.Persistence;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace DashTab.Infrastructure.Features.Categories;

public class CreateCategoryHandler(
    DashTabDbContext db,
    ICacheService cache,
    MenuCategoryMapper mapper,
    ICurrentUser currentUser) : IRequestHandler<CreateCategoryCommand, MenuCategoryDto>
{
    public async Task<MenuCategoryDto> Handle(CreateCategoryCommand command, CancellationToken cancellationToken)
    {
        var now = DateTime.UtcNow;
        var cat = mapper.ToEntity(command.Request);
        cat.Id = Guid.NewGuid();
        cat.IsDeleted = false;
        cat.CreatedAt = now;
        cat.UpdatedAt = now;
        cat.RestaurantId = currentUser.RestaurantId;
        db.MenuCategories.Add(cat);
        await db.SaveChangesAsync(cancellationToken);

        await cache.RemoveAsync(CacheKeys.MenuCategoriesAll(currentUser.RestaurantId));

        return mapper.ToDto(cat);
    }
}

public class UpdateCategoryHandler(
    DashTabDbContext db,
    ICacheService cache,
    MenuCategoryMapper mapper,
    ICurrentUser currentUser) : IRequestHandler<UpdateCategoryCommand, MenuCategoryDto?>
{
    public async Task<MenuCategoryDto?> Handle(UpdateCategoryCommand command, CancellationToken cancellationToken)
    {
        var cat = await db.MenuCategories.FirstOrDefaultAsync(c => c.Id == command.Id, cancellationToken);
        if (cat is null) return null;

        mapper.Update(command.Request, cat);
        cat.UpdatedAt = DateTime.UtcNow;
        await db.SaveChangesAsync(cancellationToken);

        var rid = currentUser.RestaurantId;
        await cache.RemoveManyAsync(new[]
        {
            CacheKeys.MenuCategoriesAll(rid),
            CacheKeys.MenuCategory(rid, command.Id),
            CacheKeys.MenuItemsAll(rid),
            CacheKeys.MenuItemsByCategory(rid, command.Id),
        });

        return mapper.ToDto(cat);
    }
}

public class DeleteCategoryHandler(
    DashTabDbContext db,
    ICacheService cache,
    ICurrentUser currentUser) : IRequestHandler<DeleteCategoryCommand, bool>
{
    public async Task<bool> Handle(DeleteCategoryCommand command, CancellationToken cancellationToken)
    {
        var cat = await db.MenuCategories.FirstOrDefaultAsync(c => c.Id == command.Id, cancellationToken);
        if (cat is null) return false;

        var hasItems = await db.MenuItems.AnyAsync(m => m.CategoryId == command.Id, cancellationToken);
        if (hasItems)
            throw new InvalidOperationException("Cannot delete a category that still has menu items.");

        cat.IsDeleted = true;
        cat.UpdatedAt = DateTime.UtcNow;
        await db.SaveChangesAsync(cancellationToken);

        var rid = currentUser.RestaurantId;
        await cache.RemoveManyAsync(new[]
        {
            CacheKeys.MenuCategoriesAll(rid),
            CacheKeys.MenuCategory(rid, command.Id),
        });

        return true;
    }
}
