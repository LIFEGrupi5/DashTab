namespace DashTab.Infrastructure.Caching;

public static class CacheKeys
{
    public const string MenuItemsAll = "menu:items:all";
    public const string MenuCategoriesAll = "menu:categories";

    public static string MenuItemsByCategory(Guid categoryId) => $"menu:items:cat:{categoryId}";
    public static string MenuItem(Guid id) => $"menu:item:{id}";
    public static string MenuCategory(Guid id) => $"menu:category:{id}";
}
