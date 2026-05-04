using DashTab.Application.Dtos;

namespace DashTab.Application.Interfaces;

public interface IAuthService
{
    Task<AuthSessionDto?> LoginAsync(string email);
    Task<StaffUserDto?> GetCurrentUserAsync(string token);
}
