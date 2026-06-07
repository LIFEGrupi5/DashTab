using DashTab.Application.Dtos;

namespace DashTab.Application.Interfaces;

public interface IForecastService
{
    Task<RevenueForecastResponse> GetRevenueForecastAsync(CancellationToken ct = default);
}
