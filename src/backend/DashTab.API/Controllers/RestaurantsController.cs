using DashTab.Application.Dtos;
using DashTab.Application.Features.Restaurants.Commands;
using DashTab.Application.Features.Restaurants.Queries;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace DashTab.API.Controllers;

[ApiController]
[Route("api/v1/restaurants")]
public class RestaurantsController(ISender sender) : ControllerBase
{
    [HttpPost("register")]
    [AllowAnonymous]
    public async Task<IActionResult> Register(
        RegisterRestaurantRequest request, CancellationToken ct)
    {
        var result = await sender.Send(new RegisterRestaurantCommand(request), ct);
        return Ok(result);
    }

    [HttpGet("me")]
    [Authorize]
    public async Task<IActionResult> Me(CancellationToken ct)
    {
        var dto = await sender.Send(new GetCurrentRestaurantQuery(), ct);
        return dto is null ? NotFound() : Ok(dto);
    }

    [HttpPut("me")]
    [Authorize(Roles = "Owner,Manager")]
    public async Task<IActionResult> UpdateMe(UpdateRestaurantRequest request, CancellationToken ct)
    {
        var dto = await sender.Send(new UpdateRestaurantCommand(request), ct);
        return dto is null ? NotFound() : Ok(dto);
    }
}
