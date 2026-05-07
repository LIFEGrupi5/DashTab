using DashTab.Application.Dtos;
using DashTab.Domain.Entities;
using Riok.Mapperly.Abstractions;

namespace DashTab.Application.Mappings;

[Mapper]
public partial class MenuCategoryMapper
{
    [MapperIgnoreSource(nameof(MenuCategory.CreatedAt))]
    [MapperIgnoreSource(nameof(MenuCategory.UpdatedAt))]
    [MapperIgnoreSource(nameof(MenuCategory.IsDeleted))]
    [MapperIgnoreSource(nameof(MenuCategory.MenuItems))]
    public partial MenuCategoryDto ToDto(MenuCategory category);

    [MapperIgnoreTarget(nameof(MenuCategory.Id))]
    [MapperIgnoreTarget(nameof(MenuCategory.CreatedAt))]
    [MapperIgnoreTarget(nameof(MenuCategory.UpdatedAt))]
    [MapperIgnoreTarget(nameof(MenuCategory.IsDeleted))]
    [MapperIgnoreTarget(nameof(MenuCategory.MenuItems))]
    public partial MenuCategory ToEntity(CreateCategoryRequest request);

    [MapperIgnoreTarget(nameof(MenuCategory.Id))]
    [MapperIgnoreTarget(nameof(MenuCategory.CreatedAt))]
    [MapperIgnoreTarget(nameof(MenuCategory.UpdatedAt))]
    [MapperIgnoreTarget(nameof(MenuCategory.IsDeleted))]
    [MapperIgnoreTarget(nameof(MenuCategory.MenuItems))]
    public partial void Update(UpdateCategoryRequest request, MenuCategory target);
}
