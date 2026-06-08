using DashTab.Application.Dtos;
using DashTab.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace DashTab.API.Controllers;

[Authorize(Roles = "Owner,Manager")]
[ApiController]
[Route("api/v1/users")]
public class UsersController(IUserService userService) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetAll(
        [FromQuery] int skip = 0,
        [FromQuery] int take = 50)
        => Ok(await userService.ListAsync(skip, take));

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetById(Guid id)
    {
        var user = await userService.GetByIdAsync(id);
        return user is null ? NotFound() : Ok(user);
    }

    [Authorize(Roles = "Owner")]
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateStaffRequest request)
    {
        var user = await userService.CreateAsync(request);
        return CreatedAtAction(nameof(GetById), new { id = user.Id }, user);
    }

    [Authorize(Roles = "Owner")]
    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateStaffRequest request)
    {
        var user = await userService.UpdateAsync(id, request);
        return user is null ? NotFound() : Ok(user);
    }

    [Authorize(Roles = "Owner")]
    [HttpPatch("{id:guid}/active")]
    public async Task<IActionResult> SetActive(Guid id, [FromBody] SetActiveRequest request)
    {
        var user = await userService.SetActiveAsync(id, request.Active);
        return user is null ? NotFound() : Ok(user);
    }

    [Authorize(Roles = "Owner")]
    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var deleted = await userService.DeleteAsync(id);
        return deleted ? NoContent() : NotFound();
    }
}
