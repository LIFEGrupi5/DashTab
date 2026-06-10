using DashTab.Application.Dtos;
using DashTab.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace DashTab.API.Controllers;

[Authorize]
[ApiController]
[Route("api/v1/schedule")]
public class ScheduleController(IScheduleService scheduleService) : ControllerBase
{
    // ── Shifts ────────────────────────────────────────────────────────────────

    // GET /api/v1/schedule/shifts?weekStart=2026-06-09
    // Workers: own published shifts only. Managers/Owners: everyone's shifts.
    [HttpGet("shifts")]
    public async Task<IActionResult> GetShifts([FromQuery] DateOnly weekStart)
        => Ok(await scheduleService.GetShiftsAsync(weekStart));

    // POST /api/v1/schedule/shifts
    [Authorize(Roles = "Owner,Manager")]
    [HttpPost("shifts")]
    public async Task<IActionResult> CreateShift([FromBody] CreateShiftRequest request)
    {
        var shift = await scheduleService.CreateShiftAsync(request);
        return CreatedAtAction(nameof(GetShifts), new { weekStart = shift.WeekStartDate }, shift);
    }

    // PUT /api/v1/schedule/shifts/{id}
    [Authorize(Roles = "Owner,Manager")]
    [HttpPut("shifts/{id:guid}")]
    public async Task<IActionResult> UpdateShift(Guid id, [FromBody] UpdateShiftRequest request)
    {
        var shift = await scheduleService.UpdateShiftAsync(id, request);
        return shift is null ? NotFound() : Ok(shift);
    }

    // DELETE /api/v1/schedule/shifts/{id}
    [Authorize(Roles = "Owner,Manager")]
    [HttpDelete("shifts/{id:guid}")]
    public async Task<IActionResult> DeleteShift(Guid id)
    {
        var deleted = await scheduleService.DeleteShiftAsync(id);
        return deleted ? NoContent() : NotFound();
    }

    // POST /api/v1/schedule/shifts/publish?weekStart=2026-06-09
    // Marks all shifts for the week as visible to workers.
    [Authorize(Roles = "Owner,Manager")]
    [HttpPost("shifts/publish")]
    public async Task<IActionResult> PublishWeek([FromQuery] DateOnly weekStart)
    {
        await scheduleService.PublishWeekAsync(weekStart);
        return NoContent();
    }

    // ── Requests ──────────────────────────────────────────────────────────────

    // GET /api/v1/schedule/requests
    // Workers: own requests. Managers/Owners: all requests.
    [HttpGet("requests")]
    public async Task<IActionResult> GetRequests()
        => Ok(await scheduleService.GetRequestsAsync());

    // POST /api/v1/schedule/requests
    [HttpPost("requests")]
    public async Task<IActionResult> SubmitRequest([FromBody] SubmitShiftRequestDto request)
    {
        var result = await scheduleService.SubmitRequestAsync(request);
        return CreatedAtAction(nameof(GetRequests), result);
    }

    // PATCH /api/v1/schedule/requests/{id}/review
    [Authorize(Roles = "Owner,Manager")]
    [HttpPatch("requests/{id:guid}/review")]
    public async Task<IActionResult> ReviewRequest(Guid id, [FromBody] ReviewRequestDto review)
    {
        var result = await scheduleService.ReviewRequestAsync(id, review);
        return result is null ? NotFound() : Ok(result);
    }
}
