using DashTab.Infrastructure.Persistence;
using DashTab.Infrastructure.Services.Storage;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Testcontainers.Keycloak;
using Testcontainers.PostgreSql;

namespace DashTab.IntegrationTests;

public class KeycloakDashTabApiFactory : WebApplicationFactory<Program>, IAsyncLifetime
{
    private readonly PostgreSqlContainer _postgres;
    private readonly KeycloakContainer _keycloak;

    public KeycloakDashTabApiFactory()
    {
        _postgres = new PostgreSqlBuilder()
            .WithImage("postgres:16-alpine")
            .Build();

        // Resolve the realm export path at construction time so the field initializer
        // doesn't run before AppContext.BaseDirectory is set
        var realmPath = Path.GetFullPath(Path.Combine(
            AppContext.BaseDirectory,
            "..", "..", "..", "..", "..", "..", "..",
            "devops", "keycloak", "realm-export.json"));

        _keycloak = new KeycloakBuilder()
            .WithImage("quay.io/keycloak/keycloak:24.0")
            // WithRealm copies the file into /opt/keycloak/data/import/ and starts
            // Keycloak with --import-realm, which seeds the dashtab realm + 4 users
            .WithRealm(realmPath)
            .Build();
    }

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.ConfigureAppConfiguration(config =>
        {
            var keycloakBase = _keycloak.GetBaseAddress().ToString().TrimEnd('/');
            config.AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["ConnectionStrings:Default"] = _postgres.GetConnectionString(),
                ["ConnectionStrings:Redis"] = null,
                // Both Authority and ValidIssuer must match the iss claim in the token.
                // Keycloak embeds the URL it was called from into the token — that URL
                // is the random localhost port the container is listening on.
                ["Keycloak:Authority"] = $"{keycloakBase}/realms/dashtab",
                ["Keycloak:Audience"] = "dashtab-api",
                ["Keycloak:ValidIssuer"] = $"{keycloakBase}/realms/dashtab",
                ["Storage:Endpoint"] = "localhost",
                ["Storage:PublicBaseUrl"] = "http://localhost:9000",
                ["Storage:AccessKey"] = "test",
                ["Storage:SecretKey"] = "test",
            });
        });

        builder.ConfigureServices(services =>
        {
            var descriptor = services.SingleOrDefault(
                d => d.ServiceType == typeof(DbContextOptions<DashTabDbContext>));
            if (descriptor != null) services.Remove(descriptor);

            var bootstrapper = services.SingleOrDefault(
                d => d.ServiceType == typeof(IHostedService) &&
                     d.ImplementationType == typeof(StorageBucketBootstrapper));
            if (bootstrapper != null) services.Remove(bootstrapper);

            services.AddDbContext<DashTabDbContext>(options =>
                options
                    .UseNpgsql(_postgres.GetConnectionString())
                    .UseSnakeCaseNamingConvention());

            // No TestAuthHandler — real JwtBearerHandler runs against real Keycloak
        });

        builder.UseEnvironment("Test");
    }

    public async Task InitializeAsync()
    {
        // Start both containers in parallel — no dependency between them
        await Task.WhenAll(_postgres.StartAsync(), _keycloak.StartAsync());

        using var scope = Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<DashTabDbContext>();
        await db.Database.MigrateAsync();
    }

    public new async Task DisposeAsync()
    {
        await Task.WhenAll(_postgres.StopAsync(), _keycloak.StopAsync());
    }
}
