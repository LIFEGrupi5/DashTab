using DashTab.Application.Dtos;
using MediatR;

namespace DashTab.Application.Features.Orders.Commands;

public record CancelOrderCommand(Guid Id) : IRequest<OrderDto?>;
