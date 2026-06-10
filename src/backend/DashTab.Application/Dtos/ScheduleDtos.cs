using DashTab.Domain.Enums;

namespace DashTab.Application.Dtos;

// --- What the API sends back to the frontend ---

public record WorkShiftDto(
    Guid Id,
    Guid UserId,
    string UserName,
    DateOnly WeekStartDate,
    DayOfWeek DayOfWeek,
    TimeOnly StartTime,
    TimeOnly EndTime,
    bool IsPublished);

public record ShiftRequestDto(
    Guid Id,
    Guid RequesterId,
    string RequesterName,
    ShiftRequestType Type,
    ShiftRequestStatus Status,
    DateOnly RequestedDate,
    Guid? TargetUserId,
    string? TargetUserName,
    DateOnly? TargetDate,
    string? Reason,
    string? ManagerNote,
    DateTime CreatedAt,
    DateTime? ReviewedAt);

// --- What the frontend sends to the API ---

public record CreateShiftRequest(
    Guid UserId,
    DateOnly WeekStartDate,
    DayOfWeek DayOfWeek,
    TimeOnly StartTime,
    TimeOnly EndTime);

public record UpdateShiftRequest(
    TimeOnly StartTime,
    TimeOnly EndTime);

public record SubmitShiftRequestDto(
    ShiftRequestType Type,
    DateOnly RequestedDate,
    Guid? TargetUserId,
    DateOnly? TargetDate,
    string? Reason);

// Decision = Approved or Denied, plus an optional note from the manager
public record ReviewRequestDto(
    ShiftRequestStatus Decision,
    string? ManagerNote);
