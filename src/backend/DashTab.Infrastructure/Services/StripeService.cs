using DashTab.Application.Interfaces;
using Microsoft.Extensions.Configuration;
using Stripe;
using Stripe.Checkout;
using Plan = DashTab.Domain.Enums.Plan;

namespace DashTab.Infrastructure.Services;

public class StripeService : IStripeService
{
    private readonly IConfiguration _config;
    private StripeClient? _client;

    public StripeService(IConfiguration config)
    {
        _config = config;
    }

    // Built lazily so merely resolving this service (e.g. the gate middleware
    // pulling in ISubscriptionService) never fails when no Stripe key is set.
    // Only an actual checkout/confirm call requires the key.
    private StripeClient Client => _client ??= new StripeClient(
        _config["Stripe:SecretKey"]
        ?? throw new InvalidOperationException("Stripe:SecretKey is not configured."));

    private string PriceId(Plan plan) => (plan switch
    {
        Plan.Basic      => _config["Stripe:Prices:Basic"],
        Plan.Pro        => _config["Stripe:Prices:Pro"],
        Plan.Enterprise => _config["Stripe:Prices:Enterprise"],
        _               => null,
    }) ?? throw new InvalidOperationException($"No Stripe price configured for plan {plan}.");

    public async Task<string> CreateCheckoutSessionAsync(
        Plan plan, Guid restaurantId, string customerEmail, CancellationToken ct = default)
    {
        var successUrl = _config["Stripe:SuccessUrl"]
            ?? throw new InvalidOperationException("Stripe:SuccessUrl is not configured.");
        var cancelUrl = _config["Stripe:CancelUrl"]
            ?? throw new InvalidOperationException("Stripe:CancelUrl is not configured.");

        // Stripe substitutes the literal {CHECKOUT_SESSION_ID} template on redirect.
        if (!successUrl.Contains("{CHECKOUT_SESSION_ID}"))
            successUrl += (successUrl.Contains('?') ? "&" : "?") + "session_id={CHECKOUT_SESSION_ID}";

        var options = new SessionCreateOptions
        {
            Mode          = "subscription",
            CustomerEmail = customerEmail,
            ClientReferenceId = restaurantId.ToString(),
            LineItems = new List<SessionLineItemOptions>
            {
                new() { Price = PriceId(plan), Quantity = 1 },
            },
            SuccessUrl = successUrl,
            CancelUrl  = cancelUrl,
            Metadata = new Dictionary<string, string>
            {
                ["restaurantId"] = restaurantId.ToString(),
                ["plan"]         = plan.ToString(),
            },
        };

        var session = await new SessionService(Client).CreateAsync(options, cancellationToken: ct);
        return session.Url;
    }

    public async Task<StripeSessionResult> GetSessionResultAsync(string sessionId, CancellationToken ct = default)
    {
        var session = await new SessionService(Client).GetAsync(sessionId, cancellationToken: ct);

        var paid =
            string.Equals(session.PaymentStatus, "paid", StringComparison.OrdinalIgnoreCase) ||
            string.Equals(session.Status, "complete", StringComparison.OrdinalIgnoreCase);

        // Period end is set app-side on confirm (UtcNow + 1 month). Without webhooks
        // we don't track Stripe renewals, so we don't read it back off the session here.
        return new StripeSessionResult(paid, session.CustomerId, session.SubscriptionId, null);
    }
}
