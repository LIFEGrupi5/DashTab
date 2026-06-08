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

public class UpdateOrderStatusHandler(DashTabDbContext db, OrderMapper mapper, IEventPublisher events)
    : IRequestHandler<UpdateOrderStatusCommand, OrderDto?>
{
    private static readonly Dictionary<OrderStatus, OrderStatus[]> AllowedTransitions = new()
    {
        [OrderStatus.New]       = [OrderStatus.Preparing, OrderStatus.Cancelled],
        [OrderStatus.Preparing] = [OrderStatus.Ready,     OrderStatus.Cancelled],
        [OrderStatus.Ready]     = [OrderStatus.Completed, OrderStatus.Cancelled],
        [OrderStatus.Completed] = [],
        [OrderStatus.Cancelled] = [],
    };

    public async Task<OrderDto?> Handle(UpdateOrderStatusCommand command, CancellationToken cancellationToken)
    {
        if (!Enum.TryParse<OrderStatus>(command.NewStatus, ignoreCase: true, out var next))
            throw new InvalidOperationException($"Unknown status '{command.NewStatus}'.");

        var order = await db.Orders.Include(o => o.Items)
            .FirstOrDefaultAsync(o => o.Id == command.Id, cancellationToken);
        if (order is null) return null;

        if (!AllowedTransitions[order.Status].Contains(next))
            throw new InvalidStateTransitionException(order.Status.ToString(), next.ToString());

        var previousStatus = order.Status;
        var now            = DateTime.UtcNow;
        order.Status       = next;
        order.StageEnteredAt = now;
        order.UpdatedAt    = now;
        await db.SaveChangesAsync(cancellationToken);

        var dto = mapper.ToDto(order, now);
        await events.PublishAsync(
            new OrderStatusChangedEvent(dto, previousStatus.ToString(), now),
            OrderRoutingKeys.StatusChanged);
        return dto;
    }
}
