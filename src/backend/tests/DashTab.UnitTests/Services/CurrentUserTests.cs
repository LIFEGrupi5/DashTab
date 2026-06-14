using System.Security.Claims;
using DashTab.Infrastructure.Services;
using Microsoft.AspNetCore.Http;

namespace DashTab.UnitTests.Services;

public class CurrentUserTests
{
    private static CurrentUser ForPrincipal(ClaimsPrincipal principal)
        => new(new HttpContextAccessor { HttpContext = new DefaultHttpContext { User = principal } });

    private static ClaimsPrincipal Principal(params Claim[] claims)
        => new(new ClaimsIdentity(claims, authenticationType: "Test"));

    [Fact]
    public void Roles_reads_the_keycloak_roles_claim()
    {
        // Keycloak emits one "roles" claim per role; with MapInboundClaims=false they keep
        // that raw type. Roles must surface them — regression: it used to read ClaimTypes.Role.
        var sut = ForPrincipal(Principal(
            new Claim("roles", "Waiter"),
            new Claim("roles", "Kitchen")));

        Assert.Equal(new[] { "Waiter", "Kitchen" }, sut.Roles);
    }

    [Fact]
    public void Roles_ignores_the_schema_role_claim_type()
    {
        // A ClaimTypes.Role claim (the schema URI) is NOT what Keycloak issues here; the old
        // implementation read it and therefore always saw an empty role list.
        var sut = ForPrincipal(Principal(new Claim(ClaimTypes.Role, "Owner")));

        Assert.Empty(sut.Roles);
    }

    [Fact]
    public void Roles_is_empty_when_no_roles_present()
    {
        var sut = ForPrincipal(new ClaimsPrincipal(new ClaimsIdentity()));

        Assert.Empty(sut.Roles);
    }

    [Fact]
    public void Id_reads_the_sub_claim()
    {
        var id = Guid.NewGuid();
        var sut = ForPrincipal(Principal(new Claim("sub", id.ToString())));

        Assert.Equal(id, sut.Id);
    }
}
