using DashTab.Domain.Enums;

namespace DashTab.Application.Interfaces;

// Result of retrieving a completed Checkout session from Stripe.
public record StripeSessionResult(
    bool Paid,
    string? CustomerId,
    string? SubscriptionId,
    DateTime? CurrentPeriodEnd);

public interface IStripeService
{
    // Creates a hosted Checkout session for the given plan and returns its URL.
    Task<string> CreateCheckoutSessionAsync(
        Plan plan, Guid restaurantId, string customerEmail, CancellationToken ct = default);

    // Retrieves a session after the redirect to verify payment and pull Stripe refs.
    Task<StripeSessionResult> GetSessionResultAsync(string sessionId, CancellationToken ct = default);
}
