using DashTab.Application.Dtos;
using DashTab.Application.Interfaces;
using DashTab.Application.Mappings;
using DashTab.Application.Storage;
using DashTab.Domain.Entities;

namespace DashTab.Infrastructure.Features.MenuItems;

/// <summary>
/// Shared mapping for menu-item handlers: maps the entity to a DTO and resolves
/// the public image URL (replicating the helper the old MenuItemService used).
/// </summary>
internal static class MenuItemDtoMapper
{
    public static MenuItemDto ToDto(MenuItem item, MenuItemMapper mapper, IStorageService storage) =>
        mapper.ToDto(item) with
        {
            ImageUrl = item.ImageObjectKey is null
                ? null
                : storage.GetPublicUrl(StorageBuckets.MenuImages, item.ImageObjectKey)
        };
}
