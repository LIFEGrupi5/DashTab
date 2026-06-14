using DashTab.Application.Dtos;
using DashTab.Application.Interfaces;
using Microsoft.AspNetCore.SignalR;

namespace DashTab.API.Realtime;

public sealed class KdsBroadcaster(IHubContext<KdsHub> hub) : IKdsBroadcaster
{
    public const string OrderPlacedEvent        = "orderPlaced";
    public const string OrderStatusChangedEvent = "orderStatusChanged";
    public const string OrderCancelledEvent     = "orderCancelled";

    public Task OrderPlacedAsync(OrderDto order, CancellationToken ct = default) =>
        hub.Clients.Group(KdsHub.KitchenGroup(order.RestaurantId)).SendAsync(OrderPlacedEvent, order, ct);

    public Task OrderStatusChangedAsync(OrderDto order, string previousStatus, CancellationToken ct = default) =>
        hub.Clients.Group(KdsHub.KitchenGroup(order.RestaurantId)).SendAsync(OrderStatusChangedEvent, order, previousStatus, ct);

    public Task OrderCancelledAsync(OrderDto order, string previousStatus, CancellationToken ct = default) =>
        hub.Clients.Group(KdsHub.KitchenGroup(order.RestaurantId)).SendAsync(OrderCancelledEvent, order, previousStatus, ct);
}
