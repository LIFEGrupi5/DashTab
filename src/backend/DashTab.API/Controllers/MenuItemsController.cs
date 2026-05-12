using DashTab.Application.Dtos;
using DashTab.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace DashTab.API.Controllers;

[Authorize]
[ApiController]
[Route("api/v1/menu-items")]
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

    [Authorize(Roles = "Owner,Manager")]
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateMenuItemRequest request)
    {
        var item = await menuItemService.CreateAsync(request);
        return CreatedAtAction(nameof(GetById), new { id = item.Id }, item);
    }

    [Authorize(Roles = "Owner,Manager")]
    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateMenuItemRequest request)
    {
        var item = await menuItemService.UpdateAsync(id, request);
        return item is null ? NotFound() : Ok(item);
    }

    [Authorize(Roles = "Owner,Manager")]
    [HttpPatch("{id:guid}/availability")]
    public async Task<IActionResult> ToggleAvailability(Guid id, [FromBody] ToggleAvailabilityRequest request)
    {
        var item = await menuItemService.ToggleAvailabilityAsync(id, request.Available);
        return item is null ? NotFound() : Ok(item);
    }

    [Authorize(Roles = "Owner,Manager")]
    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var deleted = await menuItemService.DeleteAsync(id);
        return deleted ? NoContent() : NotFound();
    }

    [Authorize(Roles = "Owner,Manager")]
    [HttpPost("{id:guid}/image/upload-url")]
    public async Task<IActionResult> RequestImageUpload(Guid id, [FromBody] ImageUploadRequest request, CancellationToken ct)
    {
        var result = await menuItemService.RequestImageUploadAsync(id, request.FileExtension, ct);
        return result is null ? NotFound() : Ok(result);
    }

    [Authorize(Roles = "Owner,Manager")]
    [HttpPut("{id:guid}/image")]
    public async Task<IActionResult> ConfirmImage(Guid id, [FromBody] CommitImageRequest request, CancellationToken ct)
    {
        var item = await menuItemService.ConfirmImageAsync(id, request.ObjectKey, ct);
        return item is null ? NotFound() : Ok(item);
    }

    [Authorize(Roles = "Owner,Manager")]
    [HttpDelete("{id:guid}/image")]
    public async Task<IActionResult> RemoveImage(Guid id, CancellationToken ct)
    {
        var removed = await menuItemService.RemoveImageAsync(id, ct);
        return removed ? NoContent() : NotFound();
    }
}
