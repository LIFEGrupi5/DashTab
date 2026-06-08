using DashTab.Application.Dtos;
using DashTab.Application.Features.MenuItems.Commands;
using DashTab.Application.Features.MenuItems.Queries;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace DashTab.API.Controllers;

[Authorize]
[ApiController]
[Route("api/v1/menu-items")]
public class MenuItemsController(ISender sender) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetAll(
        [FromQuery] Guid? categoryId,
        [FromQuery] string? search,
        [FromQuery] bool? available,
        [FromQuery] int skip = 0,
        [FromQuery] int take = 50)
        => Ok(await sender.Send(new ListMenuItemsQuery(categoryId, search, available, skip, take)));

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetById(Guid id)
    {
        var item = await sender.Send(new GetMenuItemByIdQuery(id));
        return item is null ? NotFound() : Ok(item);
    }

    [Authorize(Roles = "Owner,Manager")]
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateMenuItemRequest request)
    {
        var item = await sender.Send(new CreateMenuItemCommand(request));
        return CreatedAtAction(nameof(GetById), new { id = item.Id }, item);
    }

    [Authorize(Roles = "Owner,Manager")]
    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateMenuItemRequest request)
    {
        var item = await sender.Send(new UpdateMenuItemCommand(id, request));
        return item is null ? NotFound() : Ok(item);
    }

    [Authorize(Roles = "Owner,Manager")]
    [HttpPatch("{id:guid}/availability")]
    public async Task<IActionResult> ToggleAvailability(Guid id, [FromBody] ToggleAvailabilityRequest request)
    {
        var item = await sender.Send(new ToggleMenuItemAvailabilityCommand(id, request.Available));
        return item is null ? NotFound() : Ok(item);
    }

    [Authorize(Roles = "Owner,Manager")]
    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var deleted = await sender.Send(new DeleteMenuItemCommand(id));
        return deleted ? NoContent() : NotFound();
    }

    [Authorize(Roles = "Owner,Manager")]
    [HttpPost("{id:guid}/image/upload-url")]
    public async Task<IActionResult> RequestImageUpload(Guid id, [FromBody] ImageUploadRequest request, CancellationToken ct)
    {
        var result = await sender.Send(new RequestMenuItemImageUploadCommand(id, request), ct);
        return result is null ? NotFound() : Ok(result);
    }

    [Authorize(Roles = "Owner,Manager")]
    [HttpPut("{id:guid}/image")]
    public async Task<IActionResult> ConfirmImage(Guid id, [FromBody] CommitImageRequest request, CancellationToken ct)
    {
        var item = await sender.Send(new ConfirmMenuItemImageCommand(id, request.ObjectKey), ct);
        return item is null ? NotFound() : Ok(item);
    }

    [Authorize(Roles = "Owner,Manager")]
    [HttpDelete("{id:guid}/image")]
    public async Task<IActionResult> RemoveImage(Guid id, CancellationToken ct)
    {
        var removed = await sender.Send(new RemoveMenuItemImageCommand(id), ct);
        return removed ? NoContent() : NotFound();
    }
}
