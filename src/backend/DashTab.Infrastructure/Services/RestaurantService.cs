using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using System.Text.RegularExpressions;
using DashTab.Application.Dtos;
using DashTab.Application.Interfaces;
using DashTab.Domain.Entities;
using DashTab.Domain.Enums;
using DashTab.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;

namespace DashTab.Infrastructure.Services;

public class RestaurantService(
    DashTabDbContext db,
    IHttpClientFactory httpFactory,
    IConfiguration config) : IRestaurantService
{
    // Derives base URL and realm from existing Keycloak:Authority config.
    // Authority = "http://dashtab-keycloak/auth/realms/dashtab"
    //   BaseUrl  = "http://dashtab-keycloak/auth"
    //   Realm    = "dashtab"
    private (string BaseUrl, string Realm) KeycloakConfig()
    {
        var authority = config["Keycloak:Authority"]
            ?? throw new InvalidOperationException("Keycloak:Authority is not configured.");

        const string separator = "/realms/";
        var idx = authority.LastIndexOf(separator, StringComparison.Ordinal);
        if (idx < 0) throw new InvalidOperationException("Cannot parse Keycloak:Authority — expected '/realms/' segment.");

        var baseUrl = authority[..idx];
        var realm   = authority[(idx + separator.Length)..];
        return (baseUrl, realm);
    }

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

        var adminToken     = await GetAdminTokenAsync(ct);
        var keycloakUserId = await CreateKeycloakUserAsync(request, adminToken, ct);

        try
        {
            await AssignRoleAsync(keycloakUserId, "Owner", adminToken, ct);

            var now = DateTime.UtcNow;
            var user = new User
            {
                Id           = keycloakUserId,
                FullName     = request.OwnerFullName,
                Email        = request.OwnerEmail,
                Role         = Role.Owner,
                IsActive     = true,
                RestaurantId = restaurant.Id,
                CreatedAt    = now,
                UpdatedAt    = now,
            };
            db.Users.Add(user);
            await db.SaveChangesAsync(ct);
        }
        catch
        {
            // If anything fails after creating the Keycloak user, remove it
            // so the registration can be retried cleanly.
            await DeleteKeycloakUserAsync(keycloakUserId, adminToken, ct);
            throw;
        }

        return new RegisterRestaurantResponse(restaurant.Id, restaurant.Name, slug);
    }

    private async Task<string> GetAdminTokenAsync(CancellationToken ct)
    {
        var (baseUrl, _) = KeycloakConfig();
        var adminUsername = config["Keycloak:AdminUsername"]
            ?? throw new InvalidOperationException("Keycloak:AdminUsername is not configured.");
        var adminPassword = config["Keycloak:AdminPassword"]
            ?? throw new InvalidOperationException("Keycloak:AdminPassword is not configured.");

        var client = httpFactory.CreateClient();
        var form = new Dictionary<string, string>
        {
            ["grant_type"] = "password",
            ["client_id"]  = "admin-cli",
            ["username"]   = adminUsername,
            ["password"]   = adminPassword,
        };

        var resp = await client.PostAsync(
            $"{baseUrl}/realms/master/protocol/openid-connect/token",
            new FormUrlEncodedContent(form), ct);
        resp.EnsureSuccessStatusCode();

        var body = await resp.Content.ReadFromJsonAsync<JsonElement>(cancellationToken: ct);
        return body.GetProperty("access_token").GetString()
            ?? throw new InvalidOperationException("Keycloak admin token response missing access_token.");
    }

    private async Task<Guid> CreateKeycloakUserAsync(
        RegisterRestaurantRequest request, string adminToken, CancellationToken ct)
    {
        var (baseUrl, realm) = KeycloakConfig();
        var client = AuthorizedClient(adminToken);

        var nameParts  = request.OwnerFullName.Trim().Split(' ', 2);
        var firstName  = nameParts[0];
        var lastName   = nameParts.Length > 1 ? nameParts[1] : string.Empty;

        var payload = new
        {
            username    = request.OwnerEmail,
            email       = request.OwnerEmail,
            firstName,
            lastName,
            enabled     = true,
            credentials = new[]
            {
                new { type = "password", value = request.OwnerPassword, temporary = false }
            },
        };

        var resp = await client.PostAsJsonAsync($"{baseUrl}/admin/realms/{realm}/users", payload, ct);
        resp.EnsureSuccessStatusCode();

        var location = resp.Headers.Location?.ToString()
            ?? throw new InvalidOperationException("Keycloak did not return a Location header after user creation.");

        return Guid.Parse(location.Split('/').Last());
    }

    private async Task AssignRoleAsync(Guid userId, string roleName, string adminToken, CancellationToken ct)
    {
        var (baseUrl, realm) = KeycloakConfig();
        var client = AuthorizedClient(adminToken);

        var roleResp = await client.GetAsync($"{baseUrl}/admin/realms/{realm}/roles/{roleName}", ct);
        roleResp.EnsureSuccessStatusCode();
        var role = await roleResp.Content.ReadFromJsonAsync<JsonElement>(cancellationToken: ct);

        var assignResp = await client.PostAsJsonAsync(
            $"{baseUrl}/admin/realms/{realm}/users/{userId}/role-mappings/realm",
            new[] { role }, ct);
        assignResp.EnsureSuccessStatusCode();
    }

    private async Task DeleteKeycloakUserAsync(Guid userId, string adminToken, CancellationToken ct)
    {
        try
        {
            var (baseUrl, realm) = KeycloakConfig();
            var client = AuthorizedClient(adminToken);
            await client.DeleteAsync($"{baseUrl}/admin/realms/{realm}/users/{userId}", ct);
        }
        catch
        {
            // Best-effort cleanup — don't mask the original exception.
        }
    }

    private HttpClient AuthorizedClient(string token)
    {
        var client = httpFactory.CreateClient();
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);
        return client;
    }

    private static string GenerateSlug(string name) =>
        Regex.Replace(name.ToLowerInvariant().Trim(), @"[^a-z0-9]+", "-").Trim('-');
}
