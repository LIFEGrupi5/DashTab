using DashTab.Application.Dtos;
using MediatR;

namespace DashTab.Application.Features.Orders.Queries;

public record GetOrderByIdQuery(Guid Id) : IRequest<OrderDto?>;
