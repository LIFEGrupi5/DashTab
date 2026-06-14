using System.Security.Cryptography;
using System.Text;

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
    public static string TenantContext(string hashedKey) => $"tenant:ctx:{hashedKey}";

    // Hashes the raw user key (sub claim or email) the same way RestaurantContextMiddleware
    // does, so any service can derive the correct cache key without coupling to the middleware.
    public static string TenantContextForUser(string userKey)
    {
        var normalized = userKey.Trim().ToLowerInvariant();
        var hash = Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(normalized))).ToLowerInvariant();
        return TenantContext(hash);
    }
}
