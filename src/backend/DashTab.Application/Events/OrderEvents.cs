using DashTab.Application.Dtos;

namespace DashTab.Application.Events;

public static class OrderRoutingKeys
{
    public const string Placed         = "order.placed";
    public const string StatusChanged  = "order.status_changed";
    public const string Cancelled      = "order.cancelled";
}

public record OrderPlacedEvent(OrderDto Order, DateTime OccurredAt);

public record OrderStatusChangedEvent(OrderDto Order, string PreviousStatus, DateTime OccurredAt);

public record OrderCancelledEvent(OrderDto Order, string PreviousStatus, DateTime OccurredAt);
