using DashTab.Application.Dtos;
using DashTab.Application.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace DashTab.API.Controllers;

[ApiController]
[Route("api/v1/auth")]
public class AuthController(IAuthService authService) : ControllerBase
{
    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginRequest request)
    {
        var result = await authService.LoginAsync(request.Email);
        return result is null ? Unauthorized(new { error = "Invalid credentials." }) : Ok(result);
    }

    [HttpGet("me")]
    public async Task<IActionResult> Me()
    {
        var header = HttpContext.Request.Headers.Authorization.FirstOrDefault();
        if (string.IsNullOrEmpty(header) || !header.StartsWith("Bearer "))
            return Unauthorized(new { error = "Missing or invalid Authorization header." });

        var token = header["Bearer ".Length..].Trim();
        var user = await authService.GetCurrentUserAsync(token);
        return user is null ? Unauthorized(new { error = "Token invalid or user not found." }) : Ok(user);
    }
}
