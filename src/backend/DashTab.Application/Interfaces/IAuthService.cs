  using DashTab.Application.Dtos;

  namespace DashTab.Application.Interfaces;

  public interface IAuthService
  {
      Task<TokenResponse> LoginAsync(LoginRequest req);
      Task<TokenResponse> RefreshAsync(RefreshRequest req);
      Task LogoutAsync(LogoutRequest req);
      Task<StaffUserDto?> GetCurrentUserAsync(ICurrentUser current);
  }