using DashTab.Application.Dtos;
  using DashTab.Application.Interfaces;
  using Microsoft.AspNetCore.Authorization;
  using Microsoft.AspNetCore.Mvc;

  namespace DashTab.API.Controllers;

  [ApiController]
  [Route("api/v1/auth")]
  public class AuthController(IAuthService _service, ICurrentUser currentUser) : ControllerBase
  {
      [AllowAnonymous]
      [HttpPost("login")]
      public async Task<IActionResult> Login([FromBody] LoginRequest request)
      {
          var tokens = await _service.LoginAsync(request);
          return Ok(tokens);
      }

      [AllowAnonymous]
      [HttpPost("refresh")]
      public async Task<IActionResult> Refresh([FromBody] RefreshRequest request)
      {
          var tokens = await _service.RefreshAsync(request);
          return Ok(tokens);
      }

      [Authorize]
      [HttpPost("logout")]
      public async Task<IActionResult> Logout([FromBody] LogoutRequest request)
      {
          await _service.LogoutAsync(request);
          return NoContent();
      }

      [Authorize]
      [HttpGet("me")]
      public async Task<IActionResult> Me()
      {
          var user = await _service.GetCurrentUserAsync(currentUser);
          return user is null ? NotFound() : Ok(user);
      }
  }