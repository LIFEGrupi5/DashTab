using DashTab.Application.Dtos;
using DashTab.Application.Interfaces;
using DashTab.Domain.Entities;
using DashTab.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace DashTab.Infrastructure.Services;

public class AuthService(DashTabDbContext db) : IAuthService
{
    public async Task<AuthSessionDto?> LoginAsync(string email)
    {
        var user = await db.Users.FirstOrDefaultAsync(u => u.Email == email && u.IsActive);
        if (user is null) return null;

        var token = $"mock_token_{user.Id}";
        return new AuthSessionDto(token, ToDto(user));
    }

    public async Task<StaffUserDto?> GetCurrentUserAsync(string token)
    {
        const string prefix = "mock_token_";
        if (!token.StartsWith(prefix)) return null;
        if (!Guid.TryParse(token[prefix.Length..], out var id)) return null;

        var user = await db.Users.FindAsync(id);
        return user is null ? null : ToDto(user);
    }

    private static StaffUserDto ToDto(User u) =>
        new(u.Id, u.FullName, u.Email, u.Role.ToString().ToLower(), u.IsActive);
}
