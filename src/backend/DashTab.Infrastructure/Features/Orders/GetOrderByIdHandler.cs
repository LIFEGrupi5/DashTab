using DashTab.Application.Dtos;
using DashTab.Application.Features.Orders.Queries;
using DashTab.Application.Mappings;
using DashTab.Infrastructure.Persistence;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace DashTab.Infrastructure.Features.Orders;

public class GetOrderByIdHandler(DashTabDbContext db, OrderMapper mapper)
    : IRequestHandler<GetOrderByIdQuery, OrderDto?>
{
    public async Task<OrderDto?> Handle(GetOrderByIdQuery request, CancellationToken cancellationToken)
    {
        var order = await db.Orders.Include(o => o.Items)
            .FirstOrDefaultAsync(o => o.Id == request.Id, cancellationToken);
        return order is null ? null : mapper.ToDto(order, DateTime.UtcNow);
    }
}
