using DashTab.Application.Dtos;
using DashTab.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace DashTab.API.Controllers;

[ApiController]
[Route("api/v1/restaurants")]
public class RestaurantsController(IRestaurantService restaurantService) : ControllerBase
{
    [HttpPost("register")]
    [AllowAnonymous]
    public async Task<IActionResult> Register(
        RegisterRestaurantRequest request, CancellationToken ct)
    {
        var result = await restaurantService.RegisterAsync(request, ct);
        return Ok(result);
    }

    [HttpGet("me")]
    [Authorize]
    public async Task<IActionResult> Me(CancellationToken ct)
    {
        var dto = await restaurantService.GetCurrentAsync(ct);
        return dto is null ? NotFound() : Ok(dto);
    }

    [HttpPut("me")]
    [Authorize(Roles = "Owner,Manager")]
    public async Task<IActionResult> UpdateMe(UpdateRestaurantRequest request, CancellationToken ct)
    {
        var dto = await restaurantService.UpdateAsync(request, ct);
        return dto is null ? NotFound() : Ok(dto);
    }
}
