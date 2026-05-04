using DashTab.Application.Dtos;

namespace DashTab.Application.Interfaces;

public interface IOrderService
{
    Task<IEnumerable<OrderDto>> ListAsync(string? status = null);
    Task<OrderDto?> GetByIdAsync(Guid id);
    Task<OrderDto> CreateAsync(CreateOrderRequest request, Guid createdById);
    Task<OrderDto?> UpdateStatusAsync(Guid id, string newStatus);
    Task<OrderDto?> CancelAsync(Guid id);
}
