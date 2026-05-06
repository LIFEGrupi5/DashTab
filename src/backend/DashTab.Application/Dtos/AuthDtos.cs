namespace DashTab.Application.Dtos;

  public record LoginRequest(string Email, string Password);
  public record RefreshRequest(string RefreshToken);
  public record LogoutRequest(string RefreshToken);
  public record TokenResponse(string AccessToken, string RefreshToken, int ExpiresIn);