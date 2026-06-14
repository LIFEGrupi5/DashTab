using DashTab.Application.Dtos;
using DashTab.Application.Interfaces;
using DashTab.Domain.Entities;
using DashTab.Domain.Enums;
using DashTab.Infrastructure.Caching;
using DashTab.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace DashTab.Infrastructure.Services;

public class SubscriptionService(
    DashTabDbContext db,
    ICurrentUser currentUser,
    IStripeService stripe,
    ICacheService cache) : ISubscriptionService
{
    public async Task<CreateCheckoutResponse> CreateCheckoutAsync(
        CreateCheckoutRequest request, CancellationToken ct = default)
    {
        var plan  = ParsePlan(request.Plan);
        var rid   = currentUser.RestaurantId;
        var email = currentUser.Email
            ?? throw new InvalidOperationException("Current user has no email.");

        var url = await stripe.CreateCheckoutSessionAsync(plan, rid, email, ct);

        // Remember the chosen plan so confirm/activation knows what they bought.
        var now = DateTime.UtcNow;
        var sub = await db.Subscriptions.FirstOrDefaultAsync(s => s.RestaurantId == rid, ct);
        if (sub is null)
        {
            db.Subscriptions.Add(new Subscription
            {
                Id           = Guid.NewGuid(),
                RestaurantId = rid,
                Plan         = plan,
                Status       = SubscriptionStatus.Incomplete,
                CreatedAt    = now,
                UpdatedAt    = now,
            });
        }
        else
        {
            sub.Plan      = plan;
            sub.UpdatedAt = now;
        }
        await db.SaveChangesAsync(ct);

        return new CreateCheckoutResponse(url);
    }

    public async Task<SubscriptionDto> ConfirmAsync(
        ConfirmCheckoutRequest request, CancellationToken ct = default)
    {
        var rid    = currentUser.RestaurantId;
        var result = await stripe.GetSessionResultAsync(request.SessionId, ct);
        if (!result.Paid)
            throw new InvalidOperationException("Payment was not completed.");

        var sub = await db.Subscriptions.FirstOrDefaultAsync(s => s.RestaurantId == rid, ct)
            ?? throw new InvalidOperationException("No subscription found for this restaurant.");

        var now = DateTime.UtcNow;
        sub.Status               = SubscriptionStatus.Active;
        sub.StripeCustomerId     = result.CustomerId;
        sub.StripeSubscriptionId = result.SubscriptionId;
        sub.StripeSessionId      = request.SessionId;
        sub.CurrentPeriodEnd     = result.CurrentPeriodEnd ?? now.AddMonths(1);
        sub.UpdatedAt            = now;
        await db.SaveChangesAsync(ct);

        // Bust the per-user tenant cache so the next dashboard request sees HasActiveSub=true
        // immediately instead of waiting up to 5 minutes for the TTL to expire.
        var userId = currentUser.Id.ToString();
        await cache.RemoveAsync(CacheKeys.TenantContextForUser(userId), ct);
        if (currentUser.Email is { } email)
            await cache.RemoveAsync(CacheKeys.TenantContextForUser(email), ct);

        return await ToDto(sub, rid, ct);
    }

    public async Task<SubscriptionDto?> GetCurrentAsync(CancellationToken ct = default)
    {
        var rid = currentUser.RestaurantId;
        var sub = await db.Subscriptions.FirstOrDefaultAsync(s => s.RestaurantId == rid, ct);
        return sub is null ? null : await ToDto(sub, rid, ct);
    }

    public async Task<bool> IsActiveAsync(Guid restaurantId, CancellationToken ct = default)
    {
        var sub = await db.Subscriptions.AsNoTracking()
            .FirstOrDefaultAsync(s => s.RestaurantId == restaurantId, ct);

        return sub is not null
            && sub.Status == SubscriptionStatus.Active
            && (sub.CurrentPeriodEnd is null || sub.CurrentPeriodEnd > DateTime.UtcNow);
    }

    private async Task<SubscriptionDto> ToDto(Subscription sub, Guid rid, CancellationToken ct)
    {
        var staffUsed = await db.Users.IgnoreQueryFilters()
            .CountAsync(u => u.RestaurantId == rid && !u.IsDeleted, ct);

        var active = sub.Status == SubscriptionStatus.Active
            && (sub.CurrentPeriodEnd is null || sub.CurrentPeriodEnd > DateTime.UtcNow);

        return new SubscriptionDto(
            sub.Plan.ToString().ToLowerInvariant(),
            sub.Status.ToString().ToLowerInvariant(),
            active,
            sub.CurrentPeriodEnd,
            staffUsed,
            PlanLimits.MaxStaff(sub.Plan));
    }

    private static Plan ParsePlan(string plan) =>
        Enum.TryParse<Plan>(plan, ignoreCase: true, out var p)
            ? p
            : throw new InvalidOperationException($"Unknown plan '{plan}'.");
}
