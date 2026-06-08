using DashTab.Application.Dtos;
using DashTab.Application.Features.Staff.Commands;
using DashTab.Application.Interfaces;
using DashTab.Application.Mappings;
using DashTab.Domain.Entities;
using DashTab.Domain.Enums;
using DashTab.Infrastructure.Persistence;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace DashTab.Infrastructure.Features.Staff;

public class CreateStaffHandler(
    DashTabDbContext context,
    UserMapper mapper,
    ICurrentUser currentUser,
    IKeycloakAdminService keycloak) : IRequestHandler<CreateStaffCommand, StaffUserDto>
{
    public async Task<StaffUserDto> Handle(CreateStaffCommand command, CancellationToken cancellationToken)
    {
        var request = command.Request;
        var rid = currentUser.RestaurantId;

        // Enforce the plan's staff cap before creating anything in Keycloak.
        var sub = await context.Subscriptions.AsNoTracking()
            .FirstOrDefaultAsync(s => s.RestaurantId == rid, cancellationToken);
        if (sub is not null)
        {
            var limit   = PlanLimits.MaxStaff(sub.Plan);
            var current = await context.Users.IgnoreQueryFilters()
                .CountAsync(u => u.RestaurantId == rid && !u.IsDeleted, cancellationToken);
            if (current >= limit)
                throw new InvalidOperationException(
                    $"Your {sub.Plan} plan allows up to {limit} staff members. Upgrade your plan to add more.");
        }

        var keycloakId = await keycloak.CreateUserAsync(
            request.Email,
            request.FullName,
            request.Password,
            roleName: NormalizeRole(request.Role),
            temporaryPassword: true);

        try
        {
            var now = DateTime.UtcNow;
            var user = mapper.ToEntity(request);
            user.Id          = keycloakId;
            user.IsActive    = true;
            user.CreatedAt   = now;
            user.UpdatedAt   = now;
            user.RestaurantId = currentUser.RestaurantId;
            context.Users.Add(user);
            await context.SaveChangesAsync(cancellationToken);
            return mapper.ToDto(user);
        }
        catch
        {
            await keycloak.DeleteUserAsync(keycloakId);
            throw;
        }
    }

    // Keycloak role names are PascalCase in the dashtab realm.
    private static string NormalizeRole(string role) =>
        char.ToUpperInvariant(role[0]) + role[1..].ToLowerInvariant();
}

public class UpdateStaffHandler(
    DashTabDbContext context,
    UserMapper mapper,
    IKeycloakAdminService keycloak) : IRequestHandler<UpdateStaffCommand, StaffUserDto?>
{
    public async Task<StaffUserDto?> Handle(UpdateStaffCommand command, CancellationToken cancellationToken)
    {
        var user = await context.Users.FirstOrDefaultAsync(u => u.Id == command.Id, cancellationToken);
        if (user is null) return null;

        var request = command.Request;
        var emailChanged = !string.Equals(user.Email, request.Email, StringComparison.OrdinalIgnoreCase);

        mapper.Update(request, user);
        user.UpdatedAt = DateTime.UtcNow;
        await context.SaveChangesAsync(cancellationToken);

        if (emailChanged)
            await keycloak.UpdateUserEmailAsync(command.Id, request.Email);

        return mapper.ToDto(user);
    }
}

public class SetStaffActiveHandler(
    DashTabDbContext context,
    UserMapper mapper,
    IKeycloakAdminService keycloak) : IRequestHandler<SetStaffActiveCommand, StaffUserDto?>
{
    public async Task<StaffUserDto?> Handle(SetStaffActiveCommand command, CancellationToken cancellationToken)
    {
        var user = await context.Users.FirstOrDefaultAsync(u => u.Id == command.Id, cancellationToken);
        if (user is null) return null;

        user.IsActive  = command.Active;
        user.UpdatedAt = DateTime.UtcNow;
        await context.SaveChangesAsync(cancellationToken);

        await keycloak.SetUserEnabledAsync(command.Id, command.Active);

        return mapper.ToDto(user);
    }
}

public class DeleteStaffHandler(
    DashTabDbContext context,
    IKeycloakAdminService keycloak) : IRequestHandler<DeleteStaffCommand, bool>
{
    public async Task<bool> Handle(DeleteStaffCommand command, CancellationToken cancellationToken)
    {
        var user = await context.Users.FirstOrDefaultAsync(u => u.Id == command.Id, cancellationToken);
        if (user is null) return false;

        user.IsDeleted = true;
        user.UpdatedAt = DateTime.UtcNow;
        await context.SaveChangesAsync(cancellationToken);

        await keycloak.SetUserEnabledAsync(command.Id, enabled: false);

        return true;
    }
}
