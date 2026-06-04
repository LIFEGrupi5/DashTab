using System.Text.RegularExpressions;
using DashTab.Application.Dtos;
using DashTab.Application.Interfaces;
using DashTab.Domain.Entities;
using DashTab.Domain.Enums;
using DashTab.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace DashTab.Infrastructure.Services;

public class RestaurantService(
    DashTabDbContext db,
    IKeycloakAdminService keycloak) : IRestaurantService
{
    public async Task<RegisterRestaurantResponse> RegisterAsync(
        RegisterRestaurantRequest request, CancellationToken ct = default)
    {
        if (await db.Users.IgnoreQueryFilters().AnyAsync(u => u.Email == request.OwnerEmail, ct))
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
            roleName: "Owner", temporaryPassword: false, ct);

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
            await db.SaveChangesAsync(ct);
        }
        catch
        {
            await keycloak.DeleteUserAsync(keycloakUserId, ct);
            throw;
        }

        return new RegisterRestaurantResponse(restaurant.Id, restaurant.Name, slug);
    }

    private static string GenerateSlug(string name) =>
        Regex.Replace(name.ToLowerInvariant().Trim(), @"[^a-z0-9]+", "-").Trim('-');
}
