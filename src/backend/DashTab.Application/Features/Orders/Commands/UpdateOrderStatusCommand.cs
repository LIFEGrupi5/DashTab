using DashTab.Application.Dtos;
using MediatR;

namespace DashTab.Application.Features.Orders.Commands;

/// <summary>Advances an order to a new status (validated against the state machine).</summary>
public record UpdateOrderStatusCommand(Guid Id, string NewStatus) : IRequest<OrderDto?>;
