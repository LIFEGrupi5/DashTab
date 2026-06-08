using DashTab.Application.Dtos;
using DashTab.Application.Features.Subscriptions.Commands;
using DashTab.Application.Features.Subscriptions.Queries;
using DashTab.Application.Interfaces;
using DashTab.Domain.Entities;
using DashTab.Domain.Enums;
using DashTab.Infrastructure.Persistence;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace DashTab.Infrastructure.Features.Subscriptions;

public class CreateCheckoutHandler(DashTabDbContext db, ICurrentUser currentUser, IStripeService stripe)
    : IRequestHandler<CreateCheckoutCommand, CreateCheckoutResponse>
{
    public async Task<CreateCheckoutResponse> Handle(CreateCheckoutCommand command, CancellationToken cancellationToken)
    {
        var plan  = SubscriptionDtoFactory.ParsePlan(command.Request.Plan);
        var rid   = currentUser.RestaurantId;
        var email = currentUser.Email
            ?? throw new InvalidOperationException("Current user has no email.");

        var url = await stripe.CreateCheckoutSessionAsync(plan, rid, email, cancellationToken);

        // Remember the chosen plan so confirm/activation knows what they bought.
        var now = DateTime.UtcNow;
        var sub = await db.Subscriptions.FirstOrDefaultAsync(s => s.RestaurantId == rid, cancellationToken);
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
        await db.SaveChangesAsync(cancellationToken);

        return new CreateCheckoutResponse(url);
    }
}

public class ConfirmCheckoutHandler(DashTabDbContext db, ICurrentUser currentUser, IStripeService stripe)
    : IRequestHandler<ConfirmCheckoutCommand, SubscriptionDto>
{
    public async Task<SubscriptionDto> Handle(ConfirmCheckoutCommand command, CancellationToken cancellationToken)
    {
        var rid    = currentUser.RestaurantId;
        var result = await stripe.GetSessionResultAsync(command.Request.SessionId, cancellationToken);
        if (!result.Paid)
            throw new InvalidOperationException("Payment was not completed.");

        var sub = await db.Subscriptions.FirstOrDefaultAsync(s => s.RestaurantId == rid, cancellationToken)
            ?? throw new InvalidOperationException("No subscription found for this restaurant.");

        var now = DateTime.UtcNow;
        sub.Status               = SubscriptionStatus.Active;
        sub.StripeCustomerId     = result.CustomerId;
        sub.StripeSubscriptionId = result.SubscriptionId;
        sub.StripeSessionId      = command.Request.SessionId;
        sub.CurrentPeriodEnd     = result.CurrentPeriodEnd ?? now.AddMonths(1);
        sub.UpdatedAt            = now;
        await db.SaveChangesAsync(cancellationToken);

        return await SubscriptionDtoFactory.ToDto(db, sub, rid, cancellationToken);
    }
}

public class GetCurrentSubscriptionHandler(DashTabDbContext db, ICurrentUser currentUser)
    : IRequestHandler<GetCurrentSubscriptionQuery, SubscriptionDto?>
{
    public async Task<SubscriptionDto?> Handle(GetCurrentSubscriptionQuery request, CancellationToken cancellationToken)
    {
        var rid = currentUser.RestaurantId;
        var sub = await db.Subscriptions.FirstOrDefaultAsync(s => s.RestaurantId == rid, cancellationToken);
        return sub is null ? null : await SubscriptionDtoFactory.ToDto(db, sub, rid, cancellationToken);
    }
}

internal static class SubscriptionDtoFactory
{
    public static async Task<SubscriptionDto> ToDto(DashTabDbContext db, Subscription sub, Guid rid, CancellationToken ct)
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

    public static Plan ParsePlan(string plan) =>
        Enum.TryParse<Plan>(plan, ignoreCase: true, out var p)
            ? p
            : throw new InvalidOperationException($"Unknown plan '{plan}'.");
}
