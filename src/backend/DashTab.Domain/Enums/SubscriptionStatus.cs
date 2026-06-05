namespace DashTab.Domain.Enums;

public enum SubscriptionStatus
{
    // Restaurant registered but has not completed payment yet — app is gated.
    Incomplete,
    // Paid and within the current billing period — app is open.
    Active,
    // Subscription ended / canceled — app is gated again.
    Canceled,
}
