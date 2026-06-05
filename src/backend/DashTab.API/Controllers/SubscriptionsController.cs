using DashTab.Application.Dtos;
using DashTab.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace DashTab.API.Controllers;

[ApiController]
[Route("api/v1/subscriptions")]
[Authorize]
public class SubscriptionsController(ISubscriptionService subscriptions) : ControllerBase
{
    [HttpPost("checkout")]
    public async Task<IActionResult> Checkout(CreateCheckoutRequest request, CancellationToken ct)
        => Ok(await subscriptions.CreateCheckoutAsync(request, ct));

    [HttpPost("confirm")]
    public async Task<IActionResult> Confirm(ConfirmCheckoutRequest request, CancellationToken ct)
        => Ok(await subscriptions.ConfirmAsync(request, ct));

    [HttpGet("me")]
    public async Task<IActionResult> Me(CancellationToken ct)
    {
        var dto = await subscriptions.GetCurrentAsync(ct);
        return dto is null ? NotFound() : Ok(dto);
    }
}
