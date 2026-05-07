using DashTab.Application.Dtos;
using DashTab.Domain.Entities;
using DashTab.Domain.Enums;
using Riok.Mapperly.Abstractions;

namespace DashTab.Application.Mappings;

[Mapper(EnumNamingStrategy = EnumNamingStrategy.CamelCase)]
public partial class OrderMapper
{
    private const int DelayedThresholdMinutes = 30;

    public OrderDto ToDto(Order order, DateTime now) =>
        new(
            order.Id,
            order.OrderNumber,
            order.TableLabel,
            FormatHhMm(order.PlacedAt),
            order.CreatedByName,
            MapStatus(order.Status),
            order.TotalAmount,
            order.Items.Select(MapItem),
            FormatIso(order.PlacedAt),
            FormatIso(order.StageEnteredAt),
            IsDelayed(order, now)
        );

    [MapProperty(nameof(OrderItem.MenuItemNameSnapshot), nameof(OrderItemDto.MenuItemName))]
    [MapProperty(nameof(OrderItem.LineTotal), nameof(OrderItemDto.Amount))]
    [MapperIgnoreSource(nameof(OrderItem.Id))]
    [MapperIgnoreSource(nameof(OrderItem.OrderId))]
    [MapperIgnoreSource(nameof(OrderItem.MenuItemId))]
    [MapperIgnoreSource(nameof(OrderItem.UnitPrice))]
    [MapperIgnoreSource(nameof(OrderItem.Order))]
    [MapperIgnoreSource(nameof(OrderItem.IsDeleted))]
    [MapperIgnoreSource(nameof(OrderItem.MenuItem))]
    private partial OrderItemDto MapItem(OrderItem item);

    private partial string MapStatus(OrderStatus status);

    private static string FormatHhMm(DateTime dt) => dt.ToString("HH:mm");
    private static string FormatIso(DateTime dt) => dt.ToString("o");

    private static bool IsDelayed(Order o, DateTime now) =>
        o.Status is OrderStatus.New or OrderStatus.Preparing
        && (now - o.PlacedAt).TotalMinutes > DelayedThresholdMinutes;
}
