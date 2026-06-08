using DashTab.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace DashTab.API.Controllers;

[ApiController]
[Route("api/v1/analytics")]
[Authorize(Roles = "Owner,Manager")]
public class AnalyticsController(IForecastService forecast) : ControllerBase
{
    [HttpGet("forecast")]
    public async Task<IActionResult> Forecast(CancellationToken ct)
        => Ok(await forecast.GetRevenueForecastAsync(ct));
}
