using System.ComponentModel.DataAnnotations;
using DashTab.Domain.Enums;

namespace DashTab.Domain.Entities;

public class Subscription
{
    [Key]
    public Guid Id { get; set; }

    public Guid RestaurantId { get; set; }
    public Restaurant Restaurant { get; set; } = null!;

    public Plan Plan { get; set; }
    public SubscriptionStatus Status { get; set; } = SubscriptionStatus.Incomplete;

    // Stripe references — populated once checkout completes.
    [MaxLength(255)] public string? StripeCustomerId { get; set; }
    [MaxLength(255)] public string? StripeSubscriptionId { get; set; }
    [MaxLength(255)] public string? StripeSessionId { get; set; }

    // When the current paid period ends. Past this, the gate treats it as lapsed.
    public DateTime? CurrentPeriodEnd { get; set; }

    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}
