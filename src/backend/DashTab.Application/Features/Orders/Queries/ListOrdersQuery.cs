using DashTab.Application.Dtos;
using MediatR;

namespace DashTab.Application.Features.Orders.Queries;

public record ListOrdersQuery(string? Status = null, int Skip = 0, int Take = 50)
    : IRequest<PagedResult<OrderDto>>;
