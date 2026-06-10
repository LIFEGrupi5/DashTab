using DashTab.Application.Dtos;
using DashTab.Application.Interfaces;
using DashTab.Domain.Entities;
using DashTab.Domain.Enums;
using DashTab.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace DashTab.Infrastructure.Services;

public class ScheduleService(DashTabDbContext db, ICurrentUser currentUser) : IScheduleService
{
    // ── Shifts ────────────────────────────────────────────────────────────────

    public async Task<List<WorkShiftDto>> GetShiftsAsync(DateOnly weekStart)
    {
        var query = db.WorkShifts
            .Include(s => s.User)
            .Where(s => s.WeekStartDate == weekStart);

        // Workers only see their own published shifts
        if (currentUser.Roles.Contains("Waiter") || currentUser.Roles.Contains("Kitchen"))
            query = query.Where(s => s.UserId == currentUser.Id && s.IsPublished);

        var shifts = await query.OrderBy(s => s.DayOfWeek).ThenBy(s => s.User.FullName).ToListAsync();
        return shifts.Select(ToDto).ToList();
    }

    public async Task<WorkShiftDto> CreateShiftAsync(CreateShiftRequest request)
    {
        var now = DateTime.UtcNow;
        var shift = new WorkShift
        {
            Id            = Guid.NewGuid(),
            RestaurantId  = currentUser.RestaurantId,
            UserId        = request.UserId,
            WeekStartDate = request.WeekStartDate,
            DayOfWeek     = request.DayOfWeek,
            StartTime     = request.StartTime,
            EndTime       = request.EndTime,
            IsPublished   = false,
            CreatedAt     = now,
            UpdatedAt     = now,
        };
        db.WorkShifts.Add(shift);
        await db.SaveChangesAsync();

        // Load the User navigation so the DTO has the name
        await db.Entry(shift).Reference(s => s.User).LoadAsync();
        return ToDto(shift);
    }

    public async Task<WorkShiftDto?> UpdateShiftAsync(Guid id, UpdateShiftRequest request)
    {
        var shift = await db.WorkShifts.Include(s => s.User).FirstOrDefaultAsync(s => s.Id == id);
        if (shift is null) return null;

        shift.StartTime = request.StartTime;
        shift.EndTime   = request.EndTime;
        shift.UpdatedAt = DateTime.UtcNow;
        await db.SaveChangesAsync();
        return ToDto(shift);
    }

    public async Task<bool> DeleteShiftAsync(Guid id)
    {
        var shift = await db.WorkShifts.FirstOrDefaultAsync(s => s.Id == id);
        if (shift is null) return false;

        db.WorkShifts.Remove(shift);
        await db.SaveChangesAsync();
        return true;
    }

    public async Task PublishWeekAsync(DateOnly weekStart)
    {
        var shifts = await db.WorkShifts
            .Where(s => s.WeekStartDate == weekStart)
            .ToListAsync();

        foreach (var shift in shifts)
        {
            shift.IsPublished = true;
            shift.UpdatedAt   = DateTime.UtcNow;
        }
        await db.SaveChangesAsync();
    }

    // ── Requests ──────────────────────────────────────────────────────────────

    public async Task<List<ShiftRequestDto>> GetRequestsAsync()
    {
        var query = db.ShiftRequests
            .Include(r => r.Requester)
            .Include(r => r.TargetUser)
            .AsQueryable();

        // Workers see only their own requests; managers see all pending ones
        if (currentUser.Roles.Contains("Waiter") || currentUser.Roles.Contains("Kitchen"))
            query = query.Where(r => r.RequesterId == currentUser.Id);

        var requests = await query.OrderByDescending(r => r.CreatedAt).ToListAsync();
        return requests.Select(ToDto).ToList();
    }

    public async Task<ShiftRequestDto> SubmitRequestAsync(SubmitShiftRequestDto request)
    {
        // Same-role check for swaps — requester and target must have the same role
        if (request.Type == ShiftRequestType.ShiftSwap && request.TargetUserId.HasValue)
        {
            var requester = await db.Users.FirstOrDefaultAsync(u => u.Id == currentUser.Id);
            var target    = await db.Users.FirstOrDefaultAsync(u => u.Id == request.TargetUserId.Value);

            if (requester is null || target is null)
                throw new InvalidOperationException("User not found.");

            if (requester.Role != target.Role)
                throw new InvalidOperationException("You can only swap shifts with someone in the same role.");
        }


        var now = DateTime.UtcNow;
        var shiftRequest = new ShiftRequest
        {
            Id            = Guid.NewGuid(),
            RestaurantId  = currentUser.RestaurantId,
            RequesterId   = currentUser.Id,
            Type          = request.Type,
            Status        = ShiftRequestStatus.Pending,
            RequestedDate = request.RequestedDate,
            TargetUserId  = request.TargetUserId,
            TargetDate    = request.TargetDate,
            Reason        = request.Reason,
            CreatedAt     = now,
        };
        db.ShiftRequests.Add(shiftRequest);
        await db.SaveChangesAsync();

        await db.Entry(shiftRequest).Reference(r => r.Requester).LoadAsync();
        if (shiftRequest.TargetUserId.HasValue)
            await db.Entry(shiftRequest).Reference(r => r.TargetUser).LoadAsync();

        return ToDto(shiftRequest);
    }

    public async Task<ShiftRequestDto?> ReviewRequestAsync(Guid id, ReviewRequestDto review)
    {
        var req = await db.ShiftRequests
            .Include(r => r.Requester)
            .Include(r => r.TargetUser)
            .FirstOrDefaultAsync(r => r.Id == id);

        if (req is null) return null;

        req.Status      = review.Decision;
        req.ManagerNote = review.ManagerNote;
        req.ReviewedAt  = DateTime.UtcNow;

        // If approving a swap, swap the UserId on the two WorkShift rows atomically
        if (review.Decision == ShiftRequestStatus.Approved && req.Type == ShiftRequestType.ShiftSwap)
        {
            var requesterShift = await db.WorkShifts
                .FirstOrDefaultAsync(s => s.UserId == req.RequesterId && s.WeekStartDate == DateOnly.FromDateTime(req.RequestedDate.ToDateTime(TimeOnly.MinValue)));

            var targetShift = await db.WorkShifts
                .FirstOrDefaultAsync(s => s.UserId == req.TargetUserId && s.WeekStartDate == DateOnly.FromDateTime(req.TargetDate!.Value.ToDateTime(TimeOnly.MinValue)));

            if (requesterShift is null || targetShift is null)
                throw new InvalidOperationException("One or both shifts no longer exist. Cannot complete the swap.");

            // Re-check same-role at approval time in case roles changed after the request was submitted
            if (req.Requester.Role != req.TargetUser!.Role)
                throw new InvalidOperationException("Users no longer share the same role. Swap cannot be approved.");

            // The actual swap — one SaveChanges makes it atomic
            (requesterShift.UserId, targetShift.UserId) = (targetShift.UserId, requesterShift.UserId);
            requesterShift.UpdatedAt = DateTime.UtcNow;
            targetShift.UpdatedAt   = DateTime.UtcNow;
        }

        await db.SaveChangesAsync();
        return ToDto(req);
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private static WorkShiftDto ToDto(WorkShift s) => new(
        s.Id, s.UserId, s.User.FullName,
        s.WeekStartDate, s.DayOfWeek,
        s.StartTime, s.EndTime, s.IsPublished);

    private static ShiftRequestDto ToDto(ShiftRequest r) => new(
        r.Id, r.RequesterId, r.Requester.FullName,
        r.Type, r.Status,
        r.RequestedDate,
        r.TargetUserId, r.TargetUser?.FullName, r.TargetDate,
        r.Reason, r.ManagerNote,
        r.CreatedAt, r.ReviewedAt);
}
