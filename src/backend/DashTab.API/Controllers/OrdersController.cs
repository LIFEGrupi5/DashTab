using DashTab.Application.Dtos;
using DashTab.Application.Interfaces;
using DashTab.Domain.Exceptions;
using Microsoft.AspNetCore.Mvc;

namespace DashTab.API.Controllers;

[ApiController]
[Route("api/orders")]
public class OrdersController(IOrderService orderService, IAuthService authService) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] string? status)
        => Ok(await orderService.ListAsync(status));

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetById(Guid id)
    {
        var order = await orderService.GetByIdAsync(id);
        return order is null ? NotFound() : Ok(order);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateOrderRequest request)
    {
        var createdById = await ResolveUserIdAsync();
        var order = await orderService.CreateAsync(request, createdById);
        return CreatedAtAction(nameof(GetById), new { id = order.Id }, order);
    }

    [HttpPatch("{id:guid}/status")]
    public async Task<IActionResult> UpdateStatus(Guid id, [FromBody] UpdateOrderStatusRequest request)
    {
        try
        {
            var order = await orderService.UpdateStatusAsync(id, request.Status);
            return order is null ? NotFound() : Ok(order);
        }
        catch (InvalidStateTransitionException ex)
        {
            return UnprocessableEntity(new { error = ex.Message });
        }
    }

    [HttpPost("{id:guid}/cancel")]
    public async Task<IActionResult> Cancel(Guid id)
    {
        try
        {
            var order = await orderService.CancelAsync(id);
            return order is null ? NotFound() : Ok(order);
        }
        catch (InvalidStateTransitionException ex)
        {
            return UnprocessableEntity(new { error = ex.Message });
        }
    }

    // Resolves the calling user from the Bearer token when present;
    // falls back to the seeded waiter so the API works before auth is wired.
    private async Task<Guid> ResolveUserIdAsync()
    {
        var header = HttpContext.Request.Headers.Authorization.FirstOrDefault();
        if (!string.IsNullOrEmpty(header) && header.StartsWith("Bearer "))
        {
            var token = header["Bearer ".Length..].Trim();
            var me = await authService.GetCurrentUserAsync(token);
            if (me is not null) return me.Id;
        }
        // TODO: remove once Keycloak auth is wired
        return Guid.Parse("00000000-0000-0000-0000-000000000003");
    }
}
