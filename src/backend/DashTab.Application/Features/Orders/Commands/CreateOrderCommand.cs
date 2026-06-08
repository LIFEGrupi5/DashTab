using DashTab.Application.Dtos;
using MediatR;

namespace DashTab.Application.Features.Orders.Commands;

/// <summary>Places a new order for the current user's restaurant.</summary>
public record CreateOrderCommand(CreateOrderRequest Request) : IRequest<OrderDto>;
