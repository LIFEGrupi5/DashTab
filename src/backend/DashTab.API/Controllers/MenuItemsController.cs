using DashTab.Application.Dtos;
using DashTab.Application.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace DashTab.API.Controllers;

[ApiController]
[Route("api/menu-items")]
public class MenuItemsController(IMenuItemService menuItemService) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetAll(
        [FromQuery] Guid? categoryId,
        [FromQuery] string? search,
        [FromQuery] bool? available)
        => Ok(await menuItemService.ListAsync(categoryId, search, available));

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetById(Guid id)
    {
        var item = await menuItemService.GetByIdAsync(id);
        return item is null ? NotFound() : Ok(item);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateMenuItemRequest request)
    {
        var item = await menuItemService.CreateAsync(request);
        return CreatedAtAction(nameof(GetById), new { id = item.Id }, item);
    }

    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateMenuItemRequest request)
    {
        var item = await menuItemService.UpdateAsync(id, request);
        return item is null ? NotFound() : Ok(item);
    }

    [HttpPatch("{id:guid}/availability")]
    public async Task<IActionResult> ToggleAvailability(Guid id, [FromBody] ToggleAvailabilityRequest request)
    {
        var item = await menuItemService.ToggleAvailabilityAsync(id, request.Available);
        return item is null ? NotFound() : Ok(item);
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var deleted = await menuItemService.DeleteAsync(id);
        return deleted ? NoContent() : NotFound();
    }
}
