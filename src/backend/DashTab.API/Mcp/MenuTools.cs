using System.ComponentModel;
using DashTab.Application.Dtos;
using DashTab.Application.Interfaces;
using ModelContextProtocol.Server;

namespace DashTab.API.Mcp;

[McpServerToolType]
public static class MenuTools
{
    [McpServerTool(Name = "list_menu_items")]
    [Description("List menu items. Optionally filter by category, free-text search, or availability.")]
    public static async Task<IEnumerable<MenuItemDto>> ListMenuItems(
        IMenuItemService menu,
        [Description("Category id (GUID) to filter by. Omit for all categories.")]
        Guid? categoryId = null,
        [Description("Case-insensitive substring match against item name. Omit to skip.")]
        string? search = null,
        [Description("Filter by availability. true = only available, false = only unavailable, omit for both.")]
        bool? available = null,
        [Description("Max number of items to return (1-200). Defaults to 50.")]
        int take = 50)
    {
        take = Math.Clamp(take, 1, 200);
        var result = await menu.ListAsync(categoryId, search, available, skip: 0, take: take);
        return result.Items;
    }

    [McpServerTool(Name = "get_menu_item")]
    [Description("Get a single menu item by its id.")]
    public static Task<MenuItemDto?> GetMenuItem(
        IMenuItemService menu,
        [Description("Menu item id (GUID).")] Guid id) =>
        menu.GetByIdAsync(id);

    [McpServerTool(Name = "list_categories")]
    [Description("List all menu categories in display order.")]
    public static Task<IEnumerable<MenuCategoryDto>> ListCategories(ICategoryService categories) =>
        categories.ListAsync();
}
