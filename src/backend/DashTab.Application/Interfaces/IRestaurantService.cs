using DashTab.Application.Dtos;

namespace DashTab.Application.Interfaces;

public interface IRestaurantService
{
    Task<RegisterRestaurantResponse> RegisterAsync(RegisterRestaurantRequest request, CancellationToken ct = default);
    Task<RestaurantDto?> GetCurrentAsync(CancellationToken ct = default);
    Task<RestaurantDto?> UpdateAsync(UpdateRestaurantRequest request, CancellationToken ct = default);
}
