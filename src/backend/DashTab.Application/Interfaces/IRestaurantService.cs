using DashTab.Application.Dtos;

namespace DashTab.Application.Interfaces;

public interface IRestaurantService
{
    Task<RegisterRestaurantResponse> RegisterAsync(RegisterRestaurantRequest request, CancellationToken ct = default);
}
