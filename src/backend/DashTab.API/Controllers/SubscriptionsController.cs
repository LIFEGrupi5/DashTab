using DashTab.Application.Dtos;
using DashTab.Application.Features.Subscriptions.Commands;
using DashTab.Application.Features.Subscriptions.Queries;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace DashTab.API.Controllers;

[ApiController]
[Route("api/v1/subscriptions")]
[Authorize]
public class SubscriptionsController(ISender sender) : ControllerBase
{
    [HttpPost("checkout")]
    public async Task<IActionResult> Checkout(CreateCheckoutRequest request, CancellationToken ct)
        => Ok(await sender.Send(new CreateCheckoutCommand(request), ct));

    [HttpPost("confirm")]
    public async Task<IActionResult> Confirm(ConfirmCheckoutRequest request, CancellationToken ct)
        => Ok(await sender.Send(new ConfirmCheckoutCommand(request), ct));

    [HttpGet("me")]
    public async Task<IActionResult> Me(CancellationToken ct)
    {
        var dto = await sender.Send(new GetCurrentSubscriptionQuery(), ct);
        return dto is null ? NotFound() : Ok(dto);
    }
}
