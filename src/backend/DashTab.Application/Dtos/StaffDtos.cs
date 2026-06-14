namespace DashTab.Application.Dtos;

// Shape matches frontend StaffUser: { id, name, email, role, active }
public record StaffUserDto(Guid Id, string Name, string Email, string Role, bool Active);

public record CreateStaffRequest(
    string FullName,
    string Email,
    string Password,
    string Role,
    string? StartDate,
    string? Bio);

public record UpdateStaffRequest(
    string FullName,
    string Email,
    string Role,
    string? Bio,
    string? PhotoUrl);

public record SetActiveRequest(bool Active);
