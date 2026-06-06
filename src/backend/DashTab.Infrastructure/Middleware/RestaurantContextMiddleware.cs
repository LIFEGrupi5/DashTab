using DashTab.Application.Interfaces;
using DashTab.Infrastructure.Persistence;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;

namespace DashTab.Infrastructure.Middleware;

// Runs after UseAuthentication. For every authenticated request it:
//  1. resolves the user's RestaurantId — by the JWT `sub` (== User.Id for every
//     user we create; always present in the access token), falling back to email —
//     and stores it on the DbContext + HttpContext.Items, and
//  2. gates the app: if the restaurant has no active subscription, every request
//     except the allow-listed ones (auth, subscriptions, health…) is rejected 402.
//
// SECURITY: the query filters are strict (RestaurantId == CurrentTenantId). If the
// tenant cannot be resolved, CurrentTenantId stays null and every tenant-scoped
// query returns NOTHING — never another restaurant's data.
public class RestaurantContextMiddleware(RequestDelegate next)
{
    // Paths reachable WITHOUT an active subscription (prefix match, case-insensitive).
    private static readonly string[] AllowList =
    {
        "/api/v1/auth",
        "/api/v1/subscriptions",
        "/api/v1/restaurants/register",
        "/health",
        "/hangfire",
        "/swagger",
    };

    public async Task InvokeAsync(HttpContext ctx, DashTabDbContext db, ISubscriptionService subscriptions)
    {
        if (ctx.User.Identity?.IsAuthenticated == true)
        {
            Guid? restaurantId = null;

            // Primary: the JWT subject. For every user we create, User.Id == Keycloak
            // sub, and sub is always present in the access token (email often isn't).
            if (Guid.TryParse(ctx.User.FindFirst("sub")?.Value, out var userId))
            {
                restaurantId = await db.Users
                    .IgnoreQueryFilters()
                    .Where(u => u.Id == userId && !u.IsDeleted)
                    .Select(u => (Guid?)u.RestaurantId)
                    .FirstOrDefaultAsync();
            }

            // Fallback: email (covers any legacy user whose Id != sub).
            if (restaurantId is null)
            {
                var email = ctx.User.FindFirst("email")?.Value;
                if (!string.IsNullOrEmpty(email))
                {
                    restaurantId = await db.Users
                        .IgnoreQueryFilters()
                        .Where(u => u.Email == email && !u.IsDeleted)
                        .Select(u => (Guid?)u.RestaurantId)
                        .FirstOrDefaultAsync();
                }
            }

            if (restaurantId.HasValue)
            {
                db.CurrentTenantId = restaurantId.Value;
                ctx.Items["RestaurantId"] = restaurantId.Value;

                if (RequiresSubscription(ctx.Request)
                    && !await subscriptions.IsActiveAsync(restaurantId.Value))
                {
                    ctx.Response.StatusCode = StatusCodes.Status402PaymentRequired;
                    ctx.Response.ContentType = "application/json";
                    await ctx.Response.WriteAsync(
                        "{\"title\":\"Subscription required\",\"status\":402}");
                    return;
                }
            }
        }

        await next(ctx);
    }

    private static bool RequiresSubscription(HttpRequest req)
    {
        if (HttpMethods.IsOptions(req.Method)) return false; // CORS preflight
        var path = req.Path.Value ?? string.Empty;
        foreach (var allowed in AllowList)
            if (path.StartsWith(allowed, StringComparison.OrdinalIgnoreCase))
                return false;
        return true;
    }
}
