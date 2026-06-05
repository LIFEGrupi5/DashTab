using DashTab.Application.Dtos;

namespace DashTab.Application.Interfaces;

public interface ISubscriptionService
{
    // Starts a checkout for the current restaurant and returns the Stripe URL to redirect to.
    Task<CreateCheckoutResponse> CreateCheckoutAsync(CreateCheckoutRequest request, CancellationToken ct = default);

    // Verifies a completed checkout session and activates the restaurant's subscription.
    Task<SubscriptionDto> ConfirmAsync(ConfirmCheckoutRequest request, CancellationToken ct = default);

    // Current subscription state for the logged-in restaurant (or null if none yet).
    Task<SubscriptionDto?> GetCurrentAsync(CancellationToken ct = default);

    // True when the restaurant has an active, non-expired subscription. Used by the gate.
    Task<bool> IsActiveAsync(Guid restaurantId, CancellationToken ct = default);
}
