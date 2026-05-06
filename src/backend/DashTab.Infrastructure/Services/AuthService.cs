using System.Net.Http.Json;
using System.Text.Json.Serialization;
using DashTab.Application.Dtos;
using DashTab.Application.Interfaces;
using DashTab.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Http;

namespace DashTab.Infrastructure.Services;

public class AuthService(IHttpClientFactory
  httpClientFactory, IConfiguration config,
  DashTabDbContext db) : IAuthService
{
   private string TokenEndpoint =>
       $"{config["Keycloak:Authority"]}/protocol/openid-connect/token";

   private string LogoutEndpoint =>
       $"{config["Keycloak:Authority"]}/protocol/openid-connect/logout";

   public async Task<TokenResponse> LoginAsync(LoginRequest req)
   {
      var client = httpClientFactory.CreateClient();
      var form = new Dictionary<string, string>
      {
         ["grant_type"] = "password",
         ["client_id"] = "dashtab-frontend",
         ["username"] = req.Email,
         ["password"] = req.Password
      };

      var response = await client.PostAsync(TokenEndpoint, new FormUrlEncodedContent(form));

      if (!response.IsSuccessStatusCode)
         throw new UnauthorizedAccessException("Invalid credentials.");

      var body = await response.Content.ReadFromJsonAsync<KeycloakTokenResponse>(_jsonOptions)
              ?? throw new UnauthorizedAccessException("Empty response from Keycloak.");

      return new TokenResponse(body.AccessToken, body.RefreshToken, body.ExpiresIn);
   }

   public async Task<TokenResponse> RefreshAsync(RefreshRequest req)
   {
      var client = httpClientFactory.CreateClient();
      var form = new Dictionary<string, string>
      {
         ["grant_type"] = "refresh_token",
         ["client_id"] = "dashtab-frontend",
         ["refresh_token"] = req.RefreshToken
      };

      var response = await client.PostAsync(TokenEndpoint, new FormUrlEncodedContent(form));

      if (!response.IsSuccessStatusCode)
         throw new UnauthorizedAccessException("Refresh token invalid or expired.");

      var body = await response.Content.ReadFromJsonAsync<KeycloakTokenResponse>(_jsonOptions)
          ?? throw new UnauthorizedAccessException("Empty response from Keycloak.");

      return new TokenResponse(body.AccessToken, body.RefreshToken, body.ExpiresIn);
   }

   public async Task LogoutAsync(LogoutRequest req)
   {
      var client = httpClientFactory.CreateClient();
      var form = new Dictionary<string, string>
      {
         ["client_id"] = "dashtab-frontend",
         ["refresh_token"] = req.RefreshToken
      };

      await client.PostAsync(LogoutEndpoint, new FormUrlEncodedContent(form));
   }

   public async Task<StaffUserDto?> GetCurrentUserAsync(ICurrentUser current)
   {
      if (current.Id == Guid.Empty) return null;

      var user = await db.Users.FirstOrDefaultAsync(u => u.Email == current.Email);
      if (user is null) return null;

      return new StaffUserDto(user.Id, user.FullName, user.Email, user.Role.ToString(), user.IsActive);
   }

   private static readonly System.Text.Json.JsonSerializerOptions _jsonOptions = new()
   {
       PropertyNameCaseInsensitive = true
   };

   private record KeycloakTokenResponse(
       [property: JsonPropertyName("access_token")]  string AccessToken,
       [property: JsonPropertyName("refresh_token")] string RefreshToken,
       [property: JsonPropertyName("expires_in")]    int ExpiresIn);
}
