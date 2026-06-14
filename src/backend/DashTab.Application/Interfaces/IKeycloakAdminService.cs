namespace DashTab.Application.Interfaces;

public interface IKeycloakAdminService
{
    Task<Guid> CreateUserAsync(string email, string fullName, string password, string roleName, bool temporaryPassword = false, CancellationToken ct = default);
    Task SetUserEnabledAsync(Guid userId, bool enabled, CancellationToken ct = default);
    Task UpdateUserEmailAsync(Guid userId, string newEmail, CancellationToken ct = default);
    Task DeleteUserAsync(Guid userId, CancellationToken ct = default);
}
