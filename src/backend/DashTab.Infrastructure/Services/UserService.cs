using DashTab.Application.Dtos;
using DashTab.Application.Interfaces;
using DashTab.Domain.Entities;
using DashTab.Domain.Enums;
using DashTab.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace DashTab.Infrastructure.Services;

public class UserService(AppDbContext db) : IUserService
{
    public async Task<IEnumerable<StaffUserDto>> ListAsync()
    {
        var users = await db.Users.OrderBy(u => u.FullName).ToListAsync();
        return users.Select(ToDto);
    }

    public async Task<StaffUserDto?> GetByIdAsync(Guid id)
    {
        var user = await db.Users.FindAsync(id);
        return user is null ? null : ToDto(user);
    }

    public async Task<StaffUserDto> CreateAsync(CreateStaffRequest request)
    {
        var now = DateTime.UtcNow;
        var user = new User
        {
            Id = Guid.NewGuid(),
            FullName = request.FullName,
            Email = request.Email,
            Role = Enum.Parse<Role>(request.Role, ignoreCase: true),
            IsActive = true,
            HireStartDate = DateOnly.TryParse(request.StartDate, out var d) ? d : null,
            Bio = request.Bio,
            CreatedAt = now,
            UpdatedAt = now,
        };
        db.Users.Add(user);
        await db.SaveChangesAsync();
        return ToDto(user);
    }

    public async Task<StaffUserDto?> UpdateAsync(Guid id, UpdateStaffRequest request)
    {
        var user = await db.Users.FindAsync(id);
        if (user is null) return null;

        user.FullName = request.FullName;
        user.Email = request.Email;
        user.Role = Enum.Parse<Role>(request.Role, ignoreCase: true);
        user.Bio = request.Bio;
        user.PhotoUrl = request.PhotoUrl;
        user.UpdatedAt = DateTime.UtcNow;
        await db.SaveChangesAsync();
        return ToDto(user);
    }

    public async Task<StaffUserDto?> SetActiveAsync(Guid id, bool active)
    {
        var user = await db.Users.FindAsync(id);
        if (user is null) return null;

        user.IsActive = active;
        user.UpdatedAt = DateTime.UtcNow;
        await db.SaveChangesAsync();
        return ToDto(user);
    }

    public async Task<bool> DeleteAsync(Guid id)
    {
        var user = await db.Users.FindAsync(id);
        if (user is null) return false;

        db.Users.Remove(user);
        await db.SaveChangesAsync();
        return true;
    }

    private static StaffUserDto ToDto(User u) =>
        new(u.Id, u.FullName, u.Email, u.Role.ToString().ToLower(), u.IsActive);
}
