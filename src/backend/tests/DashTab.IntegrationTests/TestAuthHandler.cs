using System.Security.Claims;
using System.Text.Encodings.Web;
using Microsoft.AspNetCore.Authentication;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace DashTab.IntegrationTests;

public class TestAuthHandler(
    IOptionsMonitor<AuthenticationSchemeOptions> options,
    ILoggerFactory logger,
    UrlEncoder encoder) : AuthenticationHandler<AuthenticationSchemeOptions>(options, logger, encoder)
{
    protected override Task<AuthenticateResult> HandleAuthenticateAsync()
    {
        if (!Request.Headers.ContainsKey("Authorization"))
            return Task.FromResult(AuthenticateResult.Fail("No Authorization header"));

        var header = Request.Headers["Authorization"].ToString();
        if (!header.StartsWith("Bearer "))
            return Task.FromResult(AuthenticateResult.Fail("Not a bearer token"));

        var token = header["Bearer ".Length..].Trim();
        var parts = token.Split(':');
        var role = parts[0];
        var userId = parts.Length > 1 ? parts[1] : Guid.NewGuid().ToString();

        var claims = new[]
        {
              new Claim(ClaimTypes.NameIdentifier, userId),
              new Claim("sub", userId),
              new Claim("roles", role),
              new Claim(ClaimTypes.Role, role),
          };

        var identity = new ClaimsIdentity(claims, "Test");
        var principal = new ClaimsPrincipal(identity);
        var ticket = new AuthenticationTicket(principal, "Test");

        return Task.FromResult(AuthenticateResult.Success(ticket));
    }
}