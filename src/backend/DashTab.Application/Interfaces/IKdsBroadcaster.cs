using DashTab.Application.Dtos;

namespace DashTab.Application.Interfaces;

public interface IKdsBroadcaster
{
    Task OrderPlacedAsync(OrderDto order, CancellationToken ct = default);
    Task OrderStatusChangedAsync(OrderDto order, string previousStatus, CancellationToken ct = default);
    Task OrderCancelledAsync(OrderDto order, string previousStatus, CancellationToken ct = default);
}
