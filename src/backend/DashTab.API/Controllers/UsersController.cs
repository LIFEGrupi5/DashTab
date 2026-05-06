using DashTab.Application.Dtos;
using DashTab.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace DashTab.API.Controllers;

[Authorize]
[ApiController]
[Route("api/v1/users")]
public class UsersController(IUserService userService) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetAll() =>
        Ok(await userService.ListAsync());

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetById(Guid id)
    {
        var user = await userService.GetByIdAsync(id);
        return user is null ? NotFound() : Ok(user);
    }

    [Authorize(Roles = "Owner,Manager")]
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateStaffRequest request)
    {
        var user = await userService.CreateAsync(request);
        return CreatedAtAction(nameof(GetById), new { id = user.Id }, user);
    }

    [Authorize(Roles = "Owner,Manager")]
    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateStaffRequest request)
    {
        var user = await userService.UpdateAsync(id, request);
        return user is null ? NotFound() : Ok(user);
    }

    [Authorize(Roles = "Owner,Manager")]
    [HttpPatch("{id:guid}/active")]
    public async Task<IActionResult> SetActive(Guid id, [FromBody] SetActiveRequest request)
    {
        var user = await userService.SetActiveAsync(id, request.Active);
        return user is null ? NotFound() : Ok(user);
    }

    [Authorize(Roles = "Owner,Manager")]
    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var deleted = await userService.DeleteAsync(id);
        return deleted ? NoContent() : NotFound();
    }
}
