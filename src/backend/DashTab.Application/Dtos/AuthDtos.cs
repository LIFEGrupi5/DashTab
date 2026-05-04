namespace DashTab.Application.Dtos;

public record LoginRequest(string Email);

public record AuthSessionDto(string Token, StaffUserDto User);
