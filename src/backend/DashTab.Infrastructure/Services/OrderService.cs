using DashTab.Application.Dtos;
using DashTab.Application.Events;
using DashTab.Application.Interfaces;
using DashTab.Application.Mappings;
using DashTab.Domain.Entities;
using DashTab.Domain.Enums;
using DashTab.Domain.Exceptions;
using DashTab.Infrastructure.Persistence;
using DashTab.Infrastructure.Services.Jobs;
using Hangfire;
using Microsoft.EntityFrameworkCore;

namespace DashTab.Infrastructure.Services;

public class OrderService(
    DashTabDbContext db,
    OrderMapper mapper,
    IBackgroundJobClient backgroundJobs,
    IEventPublisher events,
    ICurrentUser currentUser) : IOrderService
{
    private static readonly Dictionary<OrderStatus, OrderStatus[]> AllowedTransitions = new()
    {
        [OrderStatus.New]       = [OrderStatus.Preparing, OrderStatus.Cancelled],
        [OrderStatus.Preparing] = [OrderStatus.Ready,     OrderStatus.Cancelled],
        [OrderStatus.Ready]     = [OrderStatus.Completed, OrderStatus.Cancelled],
        [OrderStatus.Completed] = [],
        [OrderStatus.Cancelled] = [],
    };

    public async Task<IEnumerable<OrderDto>> ListAsync(string? status = null)
    {
        var query = db.Orders.Include(o => o.Items).AsQueryable();

        if (!string.IsNullOrWhiteSpace(status) && Enum.TryParse<OrderStatus>(status, ignoreCase: true, out var s))
            query = query.Where(o => o.Status == s);

        var orders = await query.OrderByDescending(o => o.PlacedAt).ToListAsync();
        var now = DateTime.UtcNow;
        return orders.Select(o => mapper.ToDto(o, now));
    }

    public async Task<OrderDto?> GetByIdAsync(Guid id)
    {
        var order = await db.Orders.Include(o => o.Items).FirstOrDefaultAsync(o => o.Id == id);
        return order is null ? null : mapper.ToDto(order, DateTime.UtcNow);
    }

    public async Task<OrderDto> CreateAsync(CreateOrderRequest request, Guid createdById)
    {
        var user = await db.Users.FindAsync(createdById)
            ?? throw new InvalidOperationException("User not found.");

        var itemIds    = request.Items.Select(i => i.MenuItemId).ToList();
        var menuItems  = await db.MenuItems
            .Where(m => itemIds.Contains(m.Id))
            .ToDictionaryAsync(m => m.Id);

        var orderItems = request.Items.Select(i =>
        {
            if (!menuItems.TryGetValue(i.MenuItemId, out var m))
                throw new InvalidOperationException($"Menu item '{i.MenuItemId}' not found.");
            return new OrderItem
            {
                Id                   = Guid.NewGuid(),
                MenuItemId           = m.Id,
                MenuItemNameSnapshot = m.Name,
                Quantity             = i.Quantity,
                UnitPrice            = m.Price,
                LineTotal            = m.Price * i.Quantity,
            };
        }).ToList();

        var now         = DateTime.UtcNow;
        var orderNumber = await NextOrderNumberAsync(now);

        var order = new Order
        {
            Id           = Guid.NewGuid(),
            OrderNumber  = orderNumber,
            TableLabel   = request.TableNumber,
            Status       = OrderStatus.New,
            TotalAmount  = orderItems.Sum(i => i.LineTotal),
            Notes        = request.Notes,
            CreatedById  = createdById,
            CreatedByName = user.FullName,
            PlacedAt      = now,
            StageEnteredAt = now,
            CreatedAt    = now,
            UpdatedAt    = now,
            Items        = orderItems,
            RestaurantId = currentUser.RestaurantId,
        };

        db.Orders.Add(order);
        await db.SaveChangesAsync();

        var dto = mapper.ToDto(order, now);
        backgroundJobs.Enqueue<OrderEmailJob>(j => j.SendOrderConfirmation(order.Id));
        await events.PublishAsync(new OrderPlacedEvent(dto, now), OrderRoutingKeys.Placed);
        return dto;
    }

    public async Task<OrderDto?> UpdateStatusAsync(Guid id, string newStatus)
    {
        if (!Enum.TryParse<OrderStatus>(newStatus, ignoreCase: true, out var next))
            throw new InvalidOperationException($"Unknown status '{newStatus}'.");

        var order = await db.Orders.Include(o => o.Items).FirstOrDefaultAsync(o => o.Id == id);
        if (order is null) return null;

        if (!AllowedTransitions[order.Status].Contains(next))
            throw new InvalidStateTransitionException(order.Status.ToString(), next.ToString());

        var previousStatus = order.Status;
        var now            = DateTime.UtcNow;
        order.Status       = next;
        order.StageEnteredAt = now;
        order.UpdatedAt    = now;
        await db.SaveChangesAsync();

        var dto = mapper.ToDto(order, now);
        await events.PublishAsync(
            new OrderStatusChangedEvent(dto, previousStatus.ToString(), now),
            OrderRoutingKeys.StatusChanged);
        return dto;
    }

    public async Task<OrderDto?> CancelAsync(Guid id)
    {
        var order = await db.Orders.Include(o => o.Items).FirstOrDefaultAsync(o => o.Id == id);
        if (order is null) return null;

        if (order.Status == OrderStatus.Completed)
            throw new InvalidStateTransitionException(order.Status.ToString(), "Cancelled");

        var previousStatus = order.Status;
        var now            = DateTime.UtcNow;
        order.Status       = OrderStatus.Cancelled;
        order.StageEnteredAt = now;
        order.UpdatedAt    = now;
        await db.SaveChangesAsync();

        var dto = mapper.ToDto(order, now);
        await events.PublishAsync(
            new OrderCancelledEvent(dto, previousStatus.ToString(), now),
            OrderRoutingKeys.Cancelled);
        return dto;
    }

    private async Task<string> NextOrderNumberAsync(DateTime now)
    {
        var startOfDay = now.Date;
        var count = await db.Orders.CountAsync(o => o.PlacedAt >= startOfDay);
        return (count + 1).ToString().PadLeft(3, '0');
    }
}
