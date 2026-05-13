using System.Net;
using System.Net.Http.Headers;
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
    public async Task RealKeycloakLogin_WithValidCredentials_ReturnsTokenAndAccessesProtectedEndpoint()
    {
        var client = factory.CreateClient();

        // Step 1: real login via our /auth/login proxy
        // AuthService calls Keycloak password grant → Keycloak issues a real RS256 JWT
        var loginResp = await client.PostAsJsonAsync("/api/v1/auth/login", new
        {
            email = "owner@dashtab.dev",
            password = "Owner1!"
        });
        loginResp.StatusCode.Should().Be(HttpStatusCode.OK,
            "login with valid Keycloak credentials should succeed");

        var body = await loginResp.Content.ReadFromJsonAsync<JsonElement>();
        var token = body.GetProperty("accessToken").GetString();
        token.Should().NotBeNullOrEmpty("Keycloak should return a real RS256 JWT");

        // Step 2: use the real JWT on a protected endpoint
        // JwtBearerHandler fetches JWKS from Keycloak, validates signature + iss + aud + exp
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);
        var menuResp = await client.GetAsync("/api/v1/menu-items");
        menuResp.StatusCode.Should().Be(HttpStatusCode.OK,
            "a valid Keycloak JWT with Owner role should pass JwtBearerHandler validation");
    }
}
