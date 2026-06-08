using System.Net.Http.Json;
using System.Text.Json;
using System.Text.Json.Serialization;
using DashTab.Application.Dtos;
using DashTab.Application.Features.Auth.Commands;
using DashTab.Application.Features.Auth.Queries;
using DashTab.Application.Interfaces;
using DashTab.Application.Mappings;
using DashTab.Infrastructure.Persistence;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;

namespace DashTab.Infrastructure.Features.Auth;

public class LoginHandler(IHttpClientFactory httpClientFactory, IConfiguration config)
    : IRequestHandler<LoginCommand, TokenResponse>
{
    public Task<TokenResponse> Handle(LoginCommand command, CancellationToken cancellationToken)
    {
        var form = new Dictionary<string, string>
        {
            ["grant_type"] = "password",
            ["client_id"]  = "dashtab-frontend",
            ["username"]   = command.Request.Email,
            ["password"]   = command.Request.Password,
        };
        return KeycloakAuth.PostTokenAsync(
            httpClientFactory.CreateClient(), KeycloakAuth.TokenEndpoint(config),
            form, "Invalid credentials.", cancellationToken);
    }
}

public class RefreshTokenHandler(IHttpClientFactory httpClientFactory, IConfiguration config)
    : IRequestHandler<RefreshTokenCommand, TokenResponse>
{
    public Task<TokenResponse> Handle(RefreshTokenCommand command, CancellationToken cancellationToken)
    {
        var form = new Dictionary<string, string>
        {
            ["grant_type"]    = "refresh_token",
            ["client_id"]     = "dashtab-frontend",
            ["refresh_token"] = command.RefreshToken,
        };
        return KeycloakAuth.PostTokenAsync(
            httpClientFactory.CreateClient(), KeycloakAuth.TokenEndpoint(config),
            form, "Refresh token invalid or expired.", cancellationToken);
    }
}

public class LogoutHandler(IHttpClientFactory httpClientFactory, IConfiguration config)
    : IRequestHandler<LogoutCommand>
{
    public async Task Handle(LogoutCommand command, CancellationToken cancellationToken)
    {
        var form = new Dictionary<string, string>
        {
            ["client_id"]     = "dashtab-frontend",
            ["refresh_token"] = command.RefreshToken,
        };
        await httpClientFactory.CreateClient()
            .PostAsync(KeycloakAuth.LogoutEndpoint(config), new FormUrlEncodedContent(form), cancellationToken);
    }
}

public class GetCurrentUserHandler(DashTabDbContext db, UserMapper userMapper, ICurrentUser currentUser)
    : IRequestHandler<GetCurrentUserQuery, StaffUserDto?>
{
    public async Task<StaffUserDto?> Handle(GetCurrentUserQuery request, CancellationToken cancellationToken)
    {
        if (currentUser.Id == Guid.Empty) return null;

        var user = await db.Users.FirstOrDefaultAsync(u => u.Id == currentUser.Id, cancellationToken);
        return user is null ? null : userMapper.ToDto(user);
    }
}

/// <summary>Shared helpers for the Keycloak OpenID-Connect token endpoints.</summary>
internal static class KeycloakAuth
{
    private static readonly JsonSerializerOptions JsonOptions = new() { PropertyNameCaseInsensitive = true };

    public static string TokenEndpoint(IConfiguration config) =>
        $"{config["Keycloak:Authority"]}/protocol/openid-connect/token";

    public static string LogoutEndpoint(IConfiguration config) =>
        $"{config["Keycloak:Authority"]}/protocol/openid-connect/logout";

    public static async Task<TokenResponse> PostTokenAsync(
        HttpClient client, string endpoint, Dictionary<string, string> form,
        string failureMessage, CancellationToken ct)
    {
        var response = await client.PostAsync(endpoint, new FormUrlEncodedContent(form), ct);
        if (!response.IsSuccessStatusCode)
            throw new UnauthorizedAccessException(failureMessage);

        var body = await response.Content.ReadFromJsonAsync<KeycloakTokenResponse>(JsonOptions, ct)
            ?? throw new UnauthorizedAccessException("Empty response from Keycloak.");

        return new TokenResponse(body.AccessToken, body.RefreshToken, body.ExpiresIn);
    }

    private record KeycloakTokenResponse(
        [property: JsonPropertyName("access_token")]  string AccessToken,
        [property: JsonPropertyName("refresh_token")] string RefreshToken,
        [property: JsonPropertyName("expires_in")]    int ExpiresIn);
}
