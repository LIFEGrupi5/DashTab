using DashTab.Application.Dtos;

namespace DashTab.Application.Interfaces;

public interface IUserService
{
    Task<PagedResult<StaffUserDto>> ListAsync(int skip = 0, int take = 50);
    Task<StaffUserDto?> GetByIdAsync(Guid id);
    Task<StaffUserDto> CreateAsync(CreateStaffRequest request);
    Task<StaffUserDto?> UpdateAsync(Guid id, UpdateStaffRequest request);
    Task<StaffUserDto?> SetActiveAsync(Guid id, bool active);
    Task<bool> DeleteAsync(Guid id);
}
