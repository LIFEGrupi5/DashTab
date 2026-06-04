using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using System.Text.RegularExpressions;
using DashTab.Application.Interfaces;
using Microsoft.Extensions.Configuration;

namespace DashTab.Infrastructure.Services;

public class KeycloakAdminService(IHttpClientFactory httpFactory, IConfiguration config) : IKeycloakAdminService
{
    private (string BaseUrl, string Realm) KeycloakConfig()
    {
        var authority = config["Keycloak:Authority"]
            ?? throw new InvalidOperationException("Keycloak:Authority is not configured.");
        const string separator = "/realms/";
        var idx = authority.LastIndexOf(separator, StringComparison.Ordinal);
        if (idx < 0) throw new InvalidOperationException("Cannot parse Keycloak:Authority — expected '/realms/' segment.");
        return (authority[..idx], authority[(idx + separator.Length)..]);
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
            ?? throw new InvalidOperationException("Keycloak admin token missing access_token.");
    }

    private HttpClient AuthorizedClient(string token)
    {
        var client = httpFactory.CreateClient();
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);
        return client;
    }

    public async Task<Guid> CreateUserAsync(
        string email, string fullName, string password, string roleName,
        bool temporaryPassword = false, CancellationToken ct = default)
    {
        var (baseUrl, realm) = KeycloakConfig();
        var token  = await GetAdminTokenAsync(ct);
        var client = AuthorizedClient(token);

        var nameParts = fullName.Trim().Split(' ', 2);
        var payload = new
        {
            username    = email,
            email       = email,
            firstName   = nameParts[0],
            lastName    = nameParts.Length > 1 ? nameParts[1] : string.Empty,
            enabled     = true,
            credentials = new[]
            {
                new { type = "password", value = password, temporary = temporaryPassword }
            },
        };

        var resp = await client.PostAsJsonAsync($"{baseUrl}/admin/realms/{realm}/users", payload, ct);
        resp.EnsureSuccessStatusCode();

        var location = resp.Headers.Location?.ToString()
            ?? throw new InvalidOperationException("Keycloak did not return a Location header.");
        var userId = Guid.Parse(location.Split('/').Last());

        await AssignRoleAsync(userId, roleName, token, ct);
        return userId;
    }

    public async Task SetUserEnabledAsync(Guid userId, bool enabled, CancellationToken ct = default)
    {
        var (baseUrl, realm) = KeycloakConfig();
        var token  = await GetAdminTokenAsync(ct);
        var client = AuthorizedClient(token);
        var resp = await client.PutAsJsonAsync(
            $"{baseUrl}/admin/realms/{realm}/users/{userId}",
            new { enabled }, ct);
        resp.EnsureSuccessStatusCode();
    }

    public async Task UpdateUserEmailAsync(Guid userId, string newEmail, CancellationToken ct = default)
    {
        var (baseUrl, realm) = KeycloakConfig();
        var token  = await GetAdminTokenAsync(ct);
        var client = AuthorizedClient(token);
        var resp = await client.PutAsJsonAsync(
            $"{baseUrl}/admin/realms/{realm}/users/{userId}",
            new { email = newEmail, username = newEmail }, ct);
        resp.EnsureSuccessStatusCode();
    }

    public async Task DeleteUserAsync(Guid userId, CancellationToken ct = default)
    {
        try
        {
            var (baseUrl, realm) = KeycloakConfig();
            var token  = await GetAdminTokenAsync(ct);
            var client = AuthorizedClient(token);
            await client.DeleteAsync($"{baseUrl}/admin/realms/{realm}/users/{userId}", ct);
        }
        catch
        {
            // Best-effort — don't mask the caller's exception.
        }
    }

    private async Task AssignRoleAsync(Guid userId, string roleName, string token, CancellationToken ct)
    {
        var (baseUrl, realm) = KeycloakConfig();
        var client = AuthorizedClient(token);

        var roleResp = await client.GetAsync($"{baseUrl}/admin/realms/{realm}/roles/{roleName}", ct);
        roleResp.EnsureSuccessStatusCode();
        var role = await roleResp.Content.ReadFromJsonAsync<JsonElement>(cancellationToken: ct);

        var assignResp = await client.PostAsJsonAsync(
            $"{baseUrl}/admin/realms/{realm}/users/{userId}/role-mappings/realm",
            new[] { role }, ct);
        assignResp.EnsureSuccessStatusCode();
    }
}
