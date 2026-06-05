using DashTab.Application.Interfaces;
using DashTab.Infrastructure.Persistence;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;

namespace DashTab.Infrastructure.Middleware;

// Runs after UseAuthentication. For every authenticated request it:
//  1. resolves the user's RestaurantId (by email, the same link AuthService uses)
//     and stores it on the DbContext + HttpContext.Items, and
//  2. gates the app: if the restaurant has no active subscription, every request
//     except the allow-listed ones (auth, subscriptions, health…) is rejected 402.
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
            var email = ctx.User.FindFirst("email")?.Value;
            if (!string.IsNullOrEmpty(email))
            {
                var restaurantId = await db.Users
                    .IgnoreQueryFilters()
                    .Where(u => u.Email == email && !u.IsDeleted)
                    .Select(u => (Guid?)u.RestaurantId)
                    .FirstOrDefaultAsync();

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
