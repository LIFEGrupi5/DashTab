namespace DashTab.Application.Dtos;

// Shape matches frontend Order type exactly (camelCase via global policy)
public record OrderDto(
    Guid Id,
    string OrderNumber,
    string TableNumber,
    string CreatedAt,        // "HH:mm" wall-clock string
    string CreatedByName,
    string Status,
    decimal TotalAmount,
    IEnumerable<OrderItemDto> Items,
    string PlacedAtIso,
    string StageEnteredAtIso,
    bool Delayed,
    Guid RestaurantId);

// Shape matches frontend OrderLineItem: { menuItemName, quantity, amount }
public record OrderItemDto(string MenuItemName, int Quantity, decimal Amount);

public record CreateOrderItemRequest(Guid MenuItemId, int Quantity);

public record CreateOrderRequest(
    string TableNumber,
    string? Notes,
    IEnumerable<CreateOrderItemRequest> Items);

public record UpdateOrderStatusRequest(string Status);
