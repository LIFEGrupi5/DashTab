using DashTab.Application.Features.Analytics.Queries;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace DashTab.API.Controllers;

[ApiController]
[Route("api/v1/analytics")]
[Authorize(Roles = "Owner,Manager")]
public class AnalyticsController(ISender sender) : ControllerBase
{
    [HttpGet("forecast")]
    public async Task<IActionResult> Forecast(CancellationToken ct)
        => Ok(await sender.Send(new GetRevenueForecastQuery(), ct));
}
