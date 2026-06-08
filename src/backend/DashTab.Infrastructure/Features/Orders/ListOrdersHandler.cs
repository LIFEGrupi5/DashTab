using DashTab.Application.Dtos;
using DashTab.Application.Features.Orders.Queries;
using DashTab.Application.Mappings;
using DashTab.Domain.Enums;
using DashTab.Infrastructure.Persistence;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace DashTab.Infrastructure.Features.Orders;

public class ListOrdersHandler(DashTabDbContext db, OrderMapper mapper)
    : IRequestHandler<ListOrdersQuery, PagedResult<OrderDto>>
{
    public async Task<PagedResult<OrderDto>> Handle(ListOrdersQuery request, CancellationToken cancellationToken)
    {
        var query = db.Orders.Include(o => o.Items).AsQueryable();

        if (!string.IsNullOrWhiteSpace(request.Status) &&
            Enum.TryParse<OrderStatus>(request.Status, ignoreCase: true, out var s))
            query = query.Where(o => o.Status == s);

        var ordered = query.OrderByDescending(o => o.PlacedAt);
        var total = await ordered.CountAsync(cancellationToken);
        var orders = await ordered.Skip(request.Skip).Take(request.Take).ToListAsync(cancellationToken);
        var now = DateTime.UtcNow;
        return new PagedResult<OrderDto>(orders.Select(o => mapper.ToDto(o, now)), total, request.Skip, request.Take);
    }
}
