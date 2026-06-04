using System.Security.Claims;
using DashTab.Application.Interfaces;
using Microsoft.AspNetCore.Http;

namespace DashTab.Infrastructure.Services;

public class CurrentUser(IHttpContextAccessor accessor) : ICurrentUser
{
    private ClaimsPrincipal? User => accessor.HttpContext?.User;

    public Guid Id => Guid.TryParse(User?.FindFirstValue("sub"), out var id) ? id : Guid.Empty;

    public string? Email => User?.FindFirstValue("email");

    public IReadOnlyList<string> Roles => User?.FindAll(ClaimTypes.Role).Select(c => c.Value).ToList() ?? [];

    public Guid RestaurantId =>
        accessor.HttpContext?.Items.TryGetValue("RestaurantId", out var v) == true && v is Guid rid
            ? rid : Guid.Empty;
}
