using DashTab.Application.Dtos;
using DashTab.Application.Interfaces;
using DashTab.Infrastructure.Persistence;

namespace DashTab.Infrastructure.Services;

public class OrderService(AppDbContext db) : IOrderService
{
    public Task<IEnumerable<OrderDto>> GetAllAsync()
    {
        // replace with real db query once EF Core is wired up
        return Task.FromResult<IEnumerable<OrderDto>>([]);
    }
}
