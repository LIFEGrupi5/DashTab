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
            // Resolve the tenant and check the subscription in ONE query by joining
            // Users → Subscriptions. Previously this was 2–3 sequential DB round-trips
            // (sub lookup + optional email fallback + IsActiveAsync), each costing
            // ~1–2 s RTT on a cloud-hosted Postgres. One joined query drops that to a
            // single round-trip regardless of code path.
            Guid? restaurantId = null;
            bool   hasActiveSub = false;
            bool   needsSubCheck = RequiresSubscription(ctx.Request);

            var subClaim = ctx.User.FindFirst("sub")?.Value;
            var emailClaim = ctx.User.FindFirst("email")?.Value;

            if (subClaim is not null || emailClaim is not null)
            {
                var now = DateTime.UtcNow;
                var row = await db.Users
                    .IgnoreQueryFilters()
                    .Where(u => !u.IsDeleted &&
                                (subClaim != null
                                    ? u.Id == Guid.Parse(subClaim)
                                    : u.Email == emailClaim))
                    .Select(u => new
                    {
                        RestaurantId = (Guid?)u.RestaurantId,
                        HasActiveSub = needsSubCheck
                            ? db.Subscriptions.Any(s =>
                                s.RestaurantId == u.RestaurantId &&
                                s.Status == Domain.Enums.SubscriptionStatus.Active &&
                                (s.CurrentPeriodEnd == null || s.CurrentPeriodEnd > now))
                            : true          // skip the sub join for allow-listed paths
                    })
                    .FirstOrDefaultAsync();

                restaurantId = row?.RestaurantId;
                hasActiveSub = row?.HasActiveSub ?? false;

                // Email fallback: only if sub-based lookup returned nothing.
                if (restaurantId is null && subClaim is not null && emailClaim is not null)
                {
                    var fallback = await db.Users
                        .IgnoreQueryFilters()
                        .Where(u => u.Email == emailClaim && !u.IsDeleted)
                        .Select(u => new
                        {
                            RestaurantId = (Guid?)u.RestaurantId,
                            HasActiveSub = needsSubCheck
                                ? db.Subscriptions.Any(s =>
                                    s.RestaurantId == u.RestaurantId &&
                                    s.Status == Domain.Enums.SubscriptionStatus.Active &&
                                    (s.CurrentPeriodEnd == null || s.CurrentPeriodEnd > now))
                                : true
                        })
                        .FirstOrDefaultAsync();
                    restaurantId = fallback?.RestaurantId;
                    hasActiveSub = fallback?.HasActiveSub ?? false;
                }
            }

            if (restaurantId.HasValue)
            {
                db.CurrentTenantId = restaurantId.Value;
                ctx.Items["RestaurantId"] = restaurantId.Value;

                if (needsSubCheck && !hasActiveSub)
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
