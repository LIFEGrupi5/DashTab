using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using FluentAssertions;

namespace DashTab.IntegrationTests;

[CollectionDefinition("KeycloakApi")]
public class KeycloakApiCollection : ICollectionFixture<KeycloakDashTabApiFactory> { }

[Collection("KeycloakApi")]
[Trait("Category", "Slow")]
public class KeycloakAuthTests(KeycloakDashTabApiFactory factory)
{
    [Fact]
    public async Task RealKeycloakLogin_WithValidCredentials_ReturnsUserAndAccessesProtectedEndpoint()
    {
        // WebApplicationFactory's CreateClient() stores cookies via CookieContainerHandler,
        // so httpOnly cookies set by the server are sent automatically on subsequent
        // requests — exactly like a real browser.
        var client = factory.CreateClient();

        // Step 1: login — server calls Keycloak password grant, sets httpOnly
        // access_token + refresh_token cookies, returns decoded user in the body.
        var loginResp = await client.PostAsJsonAsync("/api/v1/auth/login", new
        {
            email    = "owner@dashtab.dev",
            password = "Owner1!"
        });
        loginResp.StatusCode.Should().Be(HttpStatusCode.OK,
            "login with valid Keycloak credentials should succeed");

        var body = await loginResp.Content.ReadFromJsonAsync<JsonElement>();
        body.GetProperty("email").GetString().Should().Be("owner@dashtab.dev",
            "login response should return the decoded user object");
        body.GetProperty("role").GetString().Should().Be("owner",
            "Owner role assigned in Keycloak realm should be present");

        // Step 2: the access_token cookie is now in the client's CookieContainer.
        // The protected endpoint should succeed without a manual Bearer header —
        // the cookie is sent automatically and JwtBearerHandler reads it via
        // OnMessageReceived (Request.Cookies["access_token"]).
        var menuResp = await client.GetAsync("/api/v1/menu-items");
        menuResp.StatusCode.Should().Be(HttpStatusCode.OK,
            "a valid Keycloak JWT in the httpOnly cookie should pass JwtBearerHandler");
    }
}
