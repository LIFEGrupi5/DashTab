using System.Security.Claims;
using DashTab.Application.Interfaces;
using Microsoft.AspNetCore.Http;

namespace DashTab.Infrastructure.Services;

public class CurrentUser(IHttpContextAccessor accessor) : ICurrentUser
{
    private ClaimsPrincipal? User => accessor.HttpContext?.User;

    public Guid Id => Guid.TryParse(User?.FindFirstValue("sub"), out var id) ? id : Guid.Empty;

    public string? Email => User?.FindFirstValue("email");

    // Keycloak puts roles in the "roles" claim, and the JWT bearer is configured with
    // MapInboundClaims=false + RoleClaimType="roles" (Program.cs) — so the raw claim type
    // stays "roles", NOT ClaimTypes.Role (the schema URI). Reading ClaimTypes.Role here
    // returned an empty list, silently disabling role checks like ScheduleService's
    // waiter/kitchen shift scoping (workers then saw the whole restaurant's shifts).
    public IReadOnlyList<string> Roles => User?.FindAll("roles").Select(c => c.Value).ToList() ?? [];

    public Guid RestaurantId =>
        accessor.HttpContext?.Items.TryGetValue("RestaurantId", out var v) == true && v is Guid rid
            ? rid : Guid.Empty;
}
