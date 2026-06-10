namespace DashTab.Infrastructure.Caching;

public static class CacheKeys
{
    public static string MenuItemsAll(Guid restaurantId) => $"r:{restaurantId}:menu:items:all";
    public static string MenuCategoriesAll(Guid restaurantId) => $"r:{restaurantId}:menu:categories";
    public static string MenuItemsByCategory(Guid restaurantId, Guid categoryId) => $"r:{restaurantId}:menu:items:cat:{categoryId}";
    public static string MenuItem(Guid restaurantId, Guid id) => $"r:{restaurantId}:menu:item:{id}";
    public static string MenuCategory(Guid restaurantId, Guid id) => $"r:{restaurantId}:menu:category:{id}";

    // Per-user resolved tenant context (restaurant + subscription status), keyed by the
    // JWT `sub` (or email). Set by RestaurantContextMiddleware on a cache miss.
    public static string TenantContext(string userKey) => $"tenant:ctx:{userKey}";
}
