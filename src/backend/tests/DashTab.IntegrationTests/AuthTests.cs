using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using FluentAssertions;

namespace DashTab.IntegrationTests;

[CollectionDefinition("Api")]
public class ApiCollection : ICollectionFixture<DashTabApiFactory> { }

[Collection("Api")]
public class AuthTests(DashTabApiFactory factory)
{
    private HttpClient Client(string? role = null)
    {
        var client = factory.CreateClient();
        if (role is not null)
            client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", role);
        return client;
    }

    [Fact]
    public async Task Request_WithNoToken_Returns401()
    {
        var response = await Client().GetAsync("/api/v1/menu-items");
        response.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
    }

    [Fact]
    public async Task Request_WithValidToken_Returns200()
    {
        var response = await Client("Owner").GetAsync("/api/v1/menu-items");
        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task CreateMenuItem_AsWaiter_Returns403()
    {
        var response = await Client("Waiter").PostAsJsonAsync("/api/v1/menu-items", new { });
        response.StatusCode.Should().Be(HttpStatusCode.Forbidden);
    }

    [Fact]
    public async Task CreateMenuItem_AsKitchen_Returns403()
    {
        var response = await Client("Kitchen").PostAsJsonAsync("/api/v1/menu-items", new { });
        response.StatusCode.Should().Be(HttpStatusCode.Forbidden);
    }

    [Fact]
    public async Task GetUsers_AsManager_Returns200()
    {
        var response = await Client("Manager").GetAsync("/api/v1/users");
        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task CreateUser_AsManager_Returns403()
    {
        var response = await Client("Manager").PostAsJsonAsync("/api/v1/users", new { });
        response.StatusCode.Should().Be(HttpStatusCode.Forbidden);
    }
}
