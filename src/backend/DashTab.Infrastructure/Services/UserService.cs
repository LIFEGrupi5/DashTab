using DashTab.Application.Dtos;
using DashTab.Application.Interfaces;
using DashTab.Application.Mappings;
using DashTab.Domain.Entities;
using DashTab.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace DashTab.Infrastructure.Services;

public class UserService(DashTabDbContext _context, UserMapper mapper) : IUserService
{
    public async Task<IEnumerable<StaffUserDto>> ListAsync()
    {
        var users = await _context.Users.OrderBy(u => u.FullName).ToListAsync();
        return users.Select(mapper.ToDto);
    }

    public async Task<StaffUserDto?> GetByIdAsync(Guid id)
    {
        var user = await _context.Users.FindAsync(id);
        return user is null ? null : mapper.ToDto(user);
    }

    public async Task<StaffUserDto> CreateAsync(CreateStaffRequest request)
    {
        var now = DateTime.UtcNow;
        var user = mapper.ToEntity(request);
        user.Id = Guid.NewGuid();
        user.IsActive = true;
        user.CreatedAt = now;
        user.UpdatedAt = now;
        _context.Users.Add(user);
        await _context.SaveChangesAsync();
        return mapper.ToDto(user);
    }

    public async Task<StaffUserDto?> UpdateAsync(Guid id, UpdateStaffRequest request)
    {
        var user = await _context.Users.FindAsync(id);
        if (user is null) return null;

        mapper.Update(request, user);
        user.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();
        return mapper.ToDto(user);
    }

    public async Task<StaffUserDto?> SetActiveAsync(Guid id, bool active)
    {
        var user = await _context.Users.FindAsync(id);
        if (user is null) return null;

        user.IsActive = active;
        user.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();
        return mapper.ToDto(user);
    }

    public async Task<bool> DeleteAsync(Guid id)
    {
        var user = await _context.Users.FindAsync(id);
        if (user is null) return false;

        user.IsDeleted = true;
        user.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();
        return true;
    }
}
