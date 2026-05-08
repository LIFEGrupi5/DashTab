using DashTab.Application.Dtos;
using DashTab.Domain.Entities;
using Riok.Mapperly.Abstractions;

namespace DashTab.Application.Mappings;

[Mapper]
public partial class MenuItemMapper
{
    [MapProperty([nameof(MenuItem.Category), nameof(MenuCategory.Name)], nameof(MenuItemDto.Category))]
    [MapProperty(nameof(MenuItem.IsAvailable), nameof(MenuItemDto.Available))]
    [MapperIgnoreSource(nameof(MenuItem.CategoryId))]
    [MapperIgnoreSource(nameof(MenuItem.CreatedAt))]
    [MapperIgnoreSource(nameof(MenuItem.UpdatedAt))]
    [MapperIgnoreSource(nameof(MenuItem.IsDeleted))]
    [MapperIgnoreSource(nameof(MenuItem.OrderItems))]
    public partial MenuItemDto ToDto(MenuItem item);

    [MapProperty(nameof(CreateMenuItemRequest.Available), nameof(MenuItem.IsAvailable))]
    [MapperIgnoreTarget(nameof(MenuItem.Id))]
    [MapperIgnoreTarget(nameof(MenuItem.CreatedAt))]
    [MapperIgnoreTarget(nameof(MenuItem.UpdatedAt))]
    [MapperIgnoreTarget(nameof(MenuItem.IsDeleted))]
    [MapperIgnoreTarget(nameof(MenuItem.Category))]
    [MapperIgnoreTarget(nameof(MenuItem.OrderItems))]
    public partial MenuItem ToEntity(CreateMenuItemRequest request);

    [MapProperty(nameof(UpdateMenuItemRequest.Available), nameof(MenuItem.IsAvailable))]
    [MapperIgnoreTarget(nameof(MenuItem.Id))]
    [MapperIgnoreTarget(nameof(MenuItem.CreatedAt))]
    [MapperIgnoreTarget(nameof(MenuItem.UpdatedAt))]
    [MapperIgnoreTarget(nameof(MenuItem.IsDeleted))]
    [MapperIgnoreTarget(nameof(MenuItem.Category))]
    [MapperIgnoreTarget(nameof(MenuItem.OrderItems))]
    public partial void Update(UpdateMenuItemRequest request, MenuItem target);
}
