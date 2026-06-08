using System.Net.Http.Json;
using System.Text.Json;
using DashTab.Application.Dtos;
using DashTab.Application.Features.Analytics.Queries;
using DashTab.Domain.Enums;
using DashTab.Infrastructure.Persistence;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace DashTab.Infrastructure.Features.Analytics;

// Pulls the current restaurant's daily revenue (orders are already tenant-filtered
// by the global query filter) and asks the Python aiops service to forecast it.
public class GetRevenueForecastHandler(
    DashTabDbContext db,
    IHttpClientFactory httpFactory,
    IConfiguration config,
    ILogger<GetRevenueForecastHandler> logger)
    : IRequestHandler<GetRevenueForecastQuery, RevenueForecastResponse>
{
    private const int LookbackDays = 90;
    private const int MinDays = 5;

    private static readonly JsonSerializerOptions JsonOpts = new() { PropertyNameCaseInsensitive = true };

    public async Task<RevenueForecastResponse> Handle(GetRevenueForecastQuery request, CancellationToken cancellationToken)
    {
        var since = DateTime.UtcNow.Date.AddDays(-LookbackDays);

        var history = await db.Orders
            .Where(o => o.Status == OrderStatus.Completed && o.PlacedAt >= since)
            .GroupBy(o => o.PlacedAt.Date)
            .Select(g => new { Date = g.Key, Revenue = g.Sum(o => o.TotalAmount) })
            .OrderBy(x => x.Date)
            .ToListAsync(cancellationToken);

        if (history.Count < MinDays)
            return new RevenueForecastResponse([], "Not enough order history yet to forecast.");

        var baseUrl = config["Aiops:BaseUrl"] ?? "http://localhost:8080";
        var payload = new
        {
            history = history.Select(h => new { date = h.Date.ToString("yyyy-MM-dd"), revenue = h.Revenue }),
            horizon = 7,
        };

        try
        {
            var client = httpFactory.CreateClient();
            client.Timeout = TimeSpan.FromSeconds(15);
            var resp = await client.PostAsJsonAsync($"{baseUrl}/forecast", payload, cancellationToken);
            if (!resp.IsSuccessStatusCode)
            {
                logger.LogWarning("Forecast service returned {Status}", resp.StatusCode);
                return new RevenueForecastResponse([], "Forecast service is unavailable.");
            }

            var result = await resp.Content.ReadFromJsonAsync<RevenueForecastResponse>(JsonOpts, cancellationToken);
            return result ?? new RevenueForecastResponse([], "Forecast service returned no data.");
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Failed to reach forecast service at {BaseUrl}", baseUrl);
            return new RevenueForecastResponse([], "Forecast service is unavailable.");
        }
    }
}
