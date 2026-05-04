using DashTab.Application.Dtos;

namespace DashTab.Application.Interfaces;

public interface IUserService
{
    Task<IEnumerable<StaffUserDto>> ListAsync();
    Task<StaffUserDto?> GetByIdAsync(Guid id);
    Task<StaffUserDto> CreateAsync(CreateStaffRequest request);
    Task<StaffUserDto?> UpdateAsync(Guid id, UpdateStaffRequest request);
    Task<StaffUserDto?> SetActiveAsync(Guid id, bool active);
    Task<bool> DeleteAsync(Guid id);
}
