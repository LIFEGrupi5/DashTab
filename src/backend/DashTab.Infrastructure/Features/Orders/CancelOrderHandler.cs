using DashTab.Application.Dtos;
using DashTab.Application.Events;
using DashTab.Application.Features.Orders.Commands;
using DashTab.Application.Interfaces;
using DashTab.Application.Mappings;
using DashTab.Domain.Enums;
using DashTab.Domain.Exceptions;
using DashTab.Infrastructure.Persistence;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace DashTab.Infrastructure.Features.Orders;

public class CancelOrderHandler(DashTabDbContext db, OrderMapper mapper, IEventPublisher events)
    : IRequestHandler<CancelOrderCommand, OrderDto?>
{
    public async Task<OrderDto?> Handle(CancelOrderCommand command, CancellationToken cancellationToken)
    {
        var order = await db.Orders.Include(o => o.Items)
            .FirstOrDefaultAsync(o => o.Id == command.Id, cancellationToken);
        if (order is null) return null;

        if (order.Status == OrderStatus.Completed)
            throw new InvalidStateTransitionException(order.Status.ToString(), "Cancelled");

        var previousStatus = order.Status;
        var now            = DateTime.UtcNow;
        order.Status       = OrderStatus.Cancelled;
        order.StageEnteredAt = now;
        order.UpdatedAt    = now;
        await db.SaveChangesAsync(cancellationToken);

        var dto = mapper.ToDto(order, now);
        await events.PublishAsync(
            new OrderCancelledEvent(dto, previousStatus.ToString(), now),
            OrderRoutingKeys.Cancelled);
        return dto;
    }
}
