using DashTab.Application.Dtos;

namespace DashTab.Application.Interfaces;

public interface IScheduleService
{
    // Shifts
    Task<List<WorkShiftDto>> GetShiftsAsync(DateOnly weekStart);
    Task<WorkShiftDto> CreateShiftAsync(CreateShiftRequest request);
    Task<WorkShiftDto?> UpdateShiftAsync(Guid id, UpdateShiftRequest request);
    Task<bool> DeleteShiftAsync(Guid id);
    Task PublishWeekAsync(DateOnly weekStart);

    // Requests
    Task<List<ShiftRequestDto>> GetRequestsAsync();
    Task<ShiftRequestDto> SubmitRequestAsync(SubmitShiftRequestDto request);
    Task<ShiftRequestDto?> ReviewRequestAsync(Guid id, ReviewRequestDto review);
}
