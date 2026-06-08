using DashTab.Application.Dtos;
using DashTab.Application.Features.Staff.Commands;
using DashTab.Application.Features.Staff.Queries;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace DashTab.API.Controllers;

[Authorize(Roles = "Owner,Manager")]
[ApiController]
[Route("api/v1/users")]
public class UsersController(ISender sender) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetAll(
        [FromQuery] int skip = 0,
        [FromQuery] int take = 50)
        => Ok(await sender.Send(new ListStaffQuery(skip, take)));

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetById(Guid id)
    {
        var user = await sender.Send(new GetStaffByIdQuery(id));
        return user is null ? NotFound() : Ok(user);
    }

    [Authorize(Roles = "Owner")]
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateStaffRequest request)
    {
        var user = await sender.Send(new CreateStaffCommand(request));
        return CreatedAtAction(nameof(GetById), new { id = user.Id }, user);
    }

    [Authorize(Roles = "Owner")]
    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateStaffRequest request)
    {
        var user = await sender.Send(new UpdateStaffCommand(id, request));
        return user is null ? NotFound() : Ok(user);
    }

    [Authorize(Roles = "Owner")]
    [HttpPatch("{id:guid}/active")]
    public async Task<IActionResult> SetActive(Guid id, [FromBody] SetActiveRequest request)
    {
        var user = await sender.Send(new SetStaffActiveCommand(id, request.Active));
        return user is null ? NotFound() : Ok(user);
    }

    [Authorize(Roles = "Owner")]
    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var deleted = await sender.Send(new DeleteStaffCommand(id));
        return deleted ? NoContent() : NotFound();
    }
}
