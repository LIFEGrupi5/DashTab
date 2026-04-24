using DashTab.Application.Dtos;

namespace DashTab.Application.Interfaces;

public interface IOrderService
{
    Task<IEnumerable<OrderDto>> GetAllAsync();
}
