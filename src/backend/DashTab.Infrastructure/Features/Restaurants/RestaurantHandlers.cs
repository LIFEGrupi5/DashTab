using System.Text.RegularExpressions;
using DashTab.Application.Dtos;
using DashTab.Application.Features.Restaurants.Commands;
using DashTab.Application.Features.Restaurants.Queries;
using DashTab.Application.Interfaces;
using DashTab.Domain.Entities;
using DashTab.Domain.Enums;
using DashTab.Infrastructure.Persistence;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace DashTab.Infrastructure.Features.Restaurants;

public class GetCurrentRestaurantHandler(DashTabDbContext db, ICurrentUser currentUser)
    : IRequestHandler<GetCurrentRestaurantQuery, RestaurantDto?>
{
    public async Task<RestaurantDto?> Handle(GetCurrentRestaurantQuery request, CancellationToken cancellationToken)
    {
        var r = await db.Restaurants
            .FirstOrDefaultAsync(x => x.Id == currentUser.RestaurantId, cancellationToken);
        return r is null ? null : new RestaurantDto(r.Id, r.Name, r.Slug, r.CreatedAt);
    }
}

public class UpdateRestaurantHandler(DashTabDbContext db, ICurrentUser currentUser)
    : IRequestHandler<UpdateRestaurantCommand, RestaurantDto?>
{
    public async Task<RestaurantDto?> Handle(UpdateRestaurantCommand command, CancellationToken cancellationToken)
    {
        var r = await db.Restaurants
            .FirstOrDefaultAsync(x => x.Id == currentUser.RestaurantId, cancellationToken);
        if (r is null) return null;

        r.Name = command.Request.Name;
        await db.SaveChangesAsync(cancellationToken);
        return new RestaurantDto(r.Id, r.Name, r.Slug, r.CreatedAt);
    }
}

public class RegisterRestaurantHandler(DashTabDbContext db, IKeycloakAdminService keycloak)
    : IRequestHandler<RegisterRestaurantCommand, RegisterRestaurantResponse>
{
    public async Task<RegisterRestaurantResponse> Handle(RegisterRestaurantCommand command, CancellationToken cancellationToken)
    {
        var request = command.Request;

        if (await db.Users.IgnoreQueryFilters().AnyAsync(u => u.Email == request.OwnerEmail, cancellationToken))
            throw new InvalidOperationException($"Email '{request.OwnerEmail}' is already registered.");

        var slug = GenerateSlug(request.RestaurantName);

        var restaurant = new Restaurant
        {
            Id        = Guid.NewGuid(),
            Name      = request.RestaurantName,
            Slug      = slug,
            IsActive  = true,
            CreatedAt = DateTime.UtcNow,
        };
        db.Restaurants.Add(restaurant);

        var keycloakUserId = await keycloak.CreateUserAsync(
            request.OwnerEmail, request.OwnerFullName, request.OwnerPassword,
            roleName: "Owner", temporaryPassword: false, cancellationToken);

        try
        {
            var now = DateTime.UtcNow;
            db.Users.Add(new User
            {
                Id           = keycloakUserId,
                FullName     = request.OwnerFullName,
                Email        = request.OwnerEmail,
                Role         = Role.Owner,
                IsActive     = true,
                RestaurantId = restaurant.Id,
                CreatedAt    = now,
                UpdatedAt    = now,
            });
            await db.SaveChangesAsync(cancellationToken);
        }
        catch
        {
            await keycloak.DeleteUserAsync(keycloakUserId, cancellationToken);
            throw;
        }

        return new RegisterRestaurantResponse(restaurant.Id, restaurant.Name, slug);
    }

    private static string GenerateSlug(string name) =>
        Regex.Replace(name.ToLowerInvariant().Trim(), @"[^a-z0-9]+", "-").Trim('-');
}
