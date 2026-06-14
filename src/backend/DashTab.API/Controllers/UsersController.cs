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

    [Authorize(Roles = "Owner,Manager")]
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateStaffRequest request)
    {
        // A manager may add staff but must not create an Owner (privilege escalation).
        if (ActorIsManagerOnly && AssignsOwner(request.Role))
            return Forbid();

        var user = await userService.CreateAsync(request);
        return CreatedAtAction(nameof(GetById), new { id = user.Id }, user);
    }

    [Authorize(Roles = "Owner,Manager")]
    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateStaffRequest request)
    {
        // A manager may not promote anyone to Owner...
        if (ActorIsManagerOnly && AssignsOwner(request.Role))
            return Forbid();
        // ...nor edit an existing Owner.
        var ownerGuard = await ForbidIfManagerTargetsOwnerAsync(id);
        if (ownerGuard is not null) return ownerGuard;

        var user = await userService.UpdateAsync(id, request);
        return user is null ? NotFound() : Ok(user);
    }

    [Authorize(Roles = "Owner,Manager")]
    [HttpPatch("{id:guid}/active")]
    public async Task<IActionResult> SetActive(Guid id, [FromBody] SetActiveRequest request)
    {
        // A manager may not (de)activate an Owner account.
        var ownerGuard = await ForbidIfManagerTargetsOwnerAsync(id);
        if (ownerGuard is not null) return ownerGuard;

        var user = await userService.SetActiveAsync(id, request.Active);
        return user is null ? NotFound() : Ok(user);
    }

    [Authorize(Roles = "Owner,Manager")]
    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        // A manager may not delete an Owner account.
        var ownerGuard = await ForbidIfManagerTargetsOwnerAsync(id);
        if (ownerGuard is not null) return ownerGuard;

        var deleted = await userService.DeleteAsync(id);
        return deleted ? NoContent() : NotFound();
    }

    // ── Privilege-escalation guard ────────────────────────────────────────────
    // Managers may manage staff but must never touch the Owner role: not assign it
    // (checked against the request) and not modify an existing owner (checked
    // against the target below). Owners themselves are unrestricted.
    private bool ActorIsManagerOnly => User.IsInRole("Manager") && !User.IsInRole("Owner");

    private static bool AssignsOwner(string? role) =>
        string.Equals(role, "Owner", StringComparison.OrdinalIgnoreCase);

    // Returns NotFound()/Forbid() when a manager targets a missing user or an Owner;
    // null when the action may proceed.
    private async Task<IActionResult?> ForbidIfManagerTargetsOwnerAsync(Guid id)
    {
        if (!ActorIsManagerOnly) return null;
        var target = await userService.GetByIdAsync(id);
        if (target is null) return NotFound();
        return AssignsOwner(target.Role) ? Forbid() : null;
    }
}
