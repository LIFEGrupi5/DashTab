using DashTab.Application.Dtos;
using DashTab.Application.Interfaces;
using DashTab.Domain.Exceptions;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace DashTab.API.Controllers;

[Authorize]
[ApiController]
[Route("api/v1/orders")]
public class OrdersController(IOrderService orderService, ICurrentUser currentUser) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetAll(
        [FromQuery] string? status,
        [FromQuery] int skip = 0,
        [FromQuery] int take = 50)
        => Ok(await orderService.ListAsync(status, skip, take));

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetById(Guid id)
    {
        var order = await orderService.GetByIdAsync(id);
        return order is null ? NotFound() : Ok(order);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateOrderRequest request)
    {
        var order = await orderService.CreateAsync(request, currentUser.Id);
        return CreatedAtAction(nameof(GetById), new { id = order.Id }, order);
    }

    [HttpPatch("{id:guid}/status")]
    public async Task<IActionResult> UpdateStatus(Guid id, [FromBody] UpdateOrderStatusRequest request)
    {
        var order = await orderService.UpdateStatusAsync(id, request.Status);
        return order is null ? NotFound() : Ok(order);
    }

    [HttpPost("{id:guid}/cancel")]
    public async Task<IActionResult> Cancel(Guid id)
    {
        var order = await orderService.CancelAsync(id);
        return order is null ? NotFound() : Ok(order);
    }
}