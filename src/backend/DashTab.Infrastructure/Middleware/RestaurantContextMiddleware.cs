using System.Security.Cryptography;
using System.Text;
using DashTab.Application.Interfaces;
using DashTab.Infrastructure.Caching;
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
// The (user → restaurant + subscription) lookup is cached per user in Redis (with an
// in-memory fallback) so only the first request within the TTL window hits the DB.
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

    // The tenant mapping rarely changes; subscription status can (a payment, an
    // expiry), so we cap staleness at a short TTL — a subscription change takes
    // effect within this window without any explicit cache invalidation.
    private static readonly TimeSpan TenantCacheTtl = TimeSpan.FromMinutes(5);

    public async Task InvokeAsync(HttpContext ctx, DashTabDbContext db, ICacheService cache)
    {
        if (ctx.User.Identity?.IsAuthenticated == true)
        {
            var needsSubCheck = RequiresSubscription(ctx.Request);

            var subClaim = ctx.User.FindFirst("sub")?.Value;
            var emailClaim = ctx.User.FindFirst("email")?.Value;
            var userKey = subClaim ?? emailClaim;

            TenantContextEntry? resolved = null;

            // 1. Fast path: per-user tenant context cached from a previous request.
            //    Saves the DB round-trip below on every request within the TTL window.
            if (userKey is not null)
                resolved = await cache.GetAsync<TenantContextEntry>(
                    CacheKeys.TenantContext(HashUserKey(userKey)), ctx.RequestAborted);

            // 2. Cache miss: resolve from the DB and cache the result. We always compute
            //    the real subscription status here (not just when needsSubCheck) so the
            //    cached entry is complete and correct for later sub-gated requests.
            if (resolved is null && userKey is not null)
            {
                resolved = await ResolveFromDbAsync(db, subClaim, emailClaim, ctx.RequestAborted);
                if (resolved is not null)
                    await cache.SetAsync(
                        CacheKeys.TenantContext(HashUserKey(userKey)), resolved, TenantCacheTtl, ctx.RequestAborted);
            }

            if (resolved is not null)
            {
                db.CurrentTenantId = resolved.RestaurantId;
                ctx.Items["RestaurantId"] = resolved.RestaurantId;

                if (needsSubCheck && !resolved.HasActiveSub)
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

    private static string HashUserKey(string userKey)
    {
        var normalized = userKey.Trim().ToLowerInvariant();
        var bytes = SHA256.HashData(Encoding.UTF8.GetBytes(normalized));
        return Convert.ToHexString(bytes).ToLowerInvariant();
    }

    // Resolves the user's restaurant + live subscription status in ONE query by
    // joining Users → Subscriptions, with an email fallback for the rare case the
    // `sub` claim doesn't match a row. IgnoreQueryFilters because CurrentTenantId is
    // exactly what we're resolving here and isn't set yet.
    private static async Task<TenantContextEntry?> ResolveFromDbAsync(
        DashTabDbContext db, string? subClaim, string? emailClaim, CancellationToken ct)
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
                u.RestaurantId,
                HasActiveSub = db.Subscriptions.Any(s =>
                    s.RestaurantId == u.RestaurantId &&
                    s.Status == Domain.Enums.SubscriptionStatus.Active &&
                    (s.CurrentPeriodEnd == null || s.CurrentPeriodEnd > now))
            })
            .FirstOrDefaultAsync(ct);

        // Email fallback: only if the sub-based lookup returned nothing.
        if (row is null && subClaim is not null && emailClaim is not null)
        {
            row = await db.Users
                .IgnoreQueryFilters()
                .Where(u => u.Email == emailClaim && !u.IsDeleted)
                .Select(u => new
                {
                    u.RestaurantId,
                    HasActiveSub = db.Subscriptions.Any(s =>
                        s.RestaurantId == u.RestaurantId &&
                        s.Status == Domain.Enums.SubscriptionStatus.Active &&
                        (s.CurrentPeriodEnd == null || s.CurrentPeriodEnd > now))
                })
                .FirstOrDefaultAsync(ct);
        }

        return row is null ? null : new TenantContextEntry(row.RestaurantId, row.HasActiveSub);
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

// Cached per-user tenant context. A record (reference type) so it satisfies
// ICacheService's `where T : class` constraint and serializes cleanly to JSON.
internal sealed record TenantContextEntry(Guid RestaurantId, bool HasActiveSub);
