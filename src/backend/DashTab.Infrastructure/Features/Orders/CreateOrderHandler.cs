using DashTab.Application.Dtos;
using DashTab.Application.Events;
using DashTab.Application.Features.Orders.Commands;
using DashTab.Application.Interfaces;
using DashTab.Application.Mappings;
using DashTab.Domain.Entities;
using DashTab.Domain.Enums;
using DashTab.Infrastructure.Persistence;
using DashTab.Infrastructure.Services.Jobs;
using Hangfire;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace DashTab.Infrastructure.Features.Orders;

public class CreateOrderHandler(
    DashTabDbContext db,
    OrderMapper mapper,
    IBackgroundJobClient backgroundJobs,
    IEventPublisher events,
    ICurrentUser currentUser) : IRequestHandler<CreateOrderCommand, OrderDto>
{
    public async Task<OrderDto> Handle(CreateOrderCommand command, CancellationToken cancellationToken)
    {
        var request = command.Request;
        var createdById = currentUser.Id;

        var user = await db.Users.FirstOrDefaultAsync(u => u.Id == createdById, cancellationToken)
            ?? throw new InvalidOperationException("User not found.");

        var itemIds = request.Items.Select(i => i.MenuItemId).ToList();
        var menuItems = await db.MenuItems
            .Where(m => itemIds.Contains(m.Id))
            .ToDictionaryAsync(m => m.Id, cancellationToken);

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
        var orderNumber = await NextOrderNumberAsync(now, cancellationToken);

        var order = new Order
        {
            Id            = Guid.NewGuid(),
            OrderNumber   = orderNumber,
            TableLabel    = request.TableNumber,
            Status        = OrderStatus.New,
            TotalAmount   = orderItems.Sum(i => i.LineTotal),
            Notes         = request.Notes,
            CreatedById   = createdById,
            CreatedByName = user.FullName,
            PlacedAt      = now,
            StageEnteredAt = now,
            CreatedAt     = now,
            UpdatedAt     = now,
            Items         = orderItems,
            RestaurantId  = currentUser.RestaurantId,
        };

        db.Orders.Add(order);
        await db.SaveChangesAsync(cancellationToken);

        var dto = mapper.ToDto(order, now);
        backgroundJobs.Enqueue<OrderEmailJob>(j => j.SendOrderConfirmation(order.Id));
        await events.PublishAsync(new OrderPlacedEvent(dto, now), OrderRoutingKeys.Placed);
        return dto;
    }

    private async Task<string> NextOrderNumberAsync(DateTime now, CancellationToken cancellationToken)
    {
        var startOfDay = now.Date;
        var count = await db.Orders.CountAsync(o => o.PlacedAt >= startOfDay, cancellationToken);
        return (count + 1).ToString().PadLeft(3, '0');
    }
}
