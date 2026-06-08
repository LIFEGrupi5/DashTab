using DashTab.Application.Dtos;
using DashTab.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace DashTab.API.Controllers;

[ApiController]
[Route("api/v1/auth")]
public class AuthController(
    IAuthService _service,
    ICurrentUser currentUser,
    IWebHostEnvironment env) : ControllerBase
{
    // Tokens live in httpOnly cookies — JS cannot read them, which prevents
    // XSS token theft. SameSite=Lax works for same-site subdomain calls
    // (app.project-05.* → api.project-05.*). Secure is off on localhost so
    // http://localhost:3000 → http://localhost:5000 still works in dev.

    [AllowAnonymous]
    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginRequest request)
    {
        var tokens = await _service.LoginAsync(request);
        AppendTokenCookies(tokens);
        // Return only the user — raw tokens stay in httpOnly cookies, invisible to JS.
        var user = await _service.GetCurrentUserAsync(currentUser);
        return Ok(user);
    }

    [AllowAnonymous]
    [HttpPost("refresh")]
    public async Task<IActionResult> Refresh()
    {
        // Read the refresh token from the httpOnly cookie (never from the body).
        var refreshToken = Request.Cookies["refresh_token"];
        if (string.IsNullOrEmpty(refreshToken))
            return Unauthorized(new { error = "No refresh token cookie present." });

        var tokens = await _service.RefreshAsync(new RefreshRequest(refreshToken));
        AppendTokenCookies(tokens);
        var user = await _service.GetCurrentUserAsync(currentUser);
        return Ok(user);
    }

    [AllowAnonymous]
    [HttpPost("logout")]
    public async Task<IActionResult> Logout()
    {
        var refreshToken = Request.Cookies["refresh_token"] ?? string.Empty;
        if (!string.IsNullOrEmpty(refreshToken))
            await _service.LogoutAsync(new LogoutRequest(refreshToken));

        // Delete must use the same Domain/Path/SameSite as Append or the browser
        // won't clear the cookie.
        var deleteOpts = CookieWith(TimeSpan.Zero);
        Response.Cookies.Delete("access_token",  deleteOpts);
        Response.Cookies.Delete("refresh_token", deleteOpts);
        return NoContent();
    }

    [Authorize]
    [HttpGet("me")]
    public async Task<IActionResult> Me()
    {
        var user = await _service.GetCurrentUserAsync(currentUser);
        return user is null ? NotFound() : Ok(user);
    }

    private void AppendTokenCookies(TokenResponse tokens)
    {
        Response.Cookies.Append("access_token", tokens.AccessToken,
            CookieWith(TimeSpan.FromSeconds(tokens.ExpiresIn)));
        Response.Cookies.Append("refresh_token", tokens.RefreshToken,
            CookieWith(TimeSpan.FromDays(30)));
    }

    // In Development AND Test environments: no Secure flag (plain http works) and
    // no Domain restriction (test HttpClient hits http://localhost, which would
    // reject a cookie scoped to .project-05.gjirafa.dev).
    private bool IsLocalEnv => env.IsDevelopment() || env.IsEnvironment("Test");

    private CookieOptions CookieWith(TimeSpan maxAge) => new()
    {
        HttpOnly = true,
        Secure   = !IsLocalEnv,
        SameSite = SameSiteMode.Lax,
        Domain   = IsLocalEnv ? null : ".project-05.gjirafa.dev",
        Path     = "/",
        MaxAge   = maxAge,
    };
}