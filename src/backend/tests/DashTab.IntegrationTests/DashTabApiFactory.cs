using DashTab.Infrastructure.Persistence;
using DashTab.Infrastructure.Services.Storage;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Testcontainers.PostgreSql;

namespace DashTab.IntegrationTests;

public class DashTabApiFactory : WebApplicationFactory<Program>, IAsyncLifetime
{
    private readonly PostgreSqlContainer _postgres = new PostgreSqlBuilder()
        .WithImage("postgres:16-alpine")
        .Build();

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.ConfigureAppConfiguration(config =>
        {
            config.AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["ConnectionStrings:Default"] = _postgres.GetConnectionString(),
                ["ConnectionStrings:Redis"] = null,
                ["Keycloak:Authority"] = "http://localhost:8080/realms/dashtab",
                ["Keycloak:Audience"] = "dashtab-api",
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

            services.AddAuthentication()
                .AddScheme<Microsoft.AspNetCore.Authentication.AuthenticationSchemeOptions,
                    TestAuthHandler>("Test", _ => { });

            services.PostConfigure<Microsoft.AspNetCore.Authentication.AuthenticationOptions>(o =>
            {
                o.DefaultAuthenticateScheme = "Test";
                o.DefaultChallengeScheme = "Test";
                o.DefaultScheme = "Test";
            });
        });

        builder.UseEnvironment("Test");
    }

    public async Task InitializeAsync()
    {
        await _postgres.StartAsync();
        using var scope = Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<DashTabDbContext>();
        await db.Database.MigrateAsync();
    }

    public new async Task DisposeAsync()
    {
        await _postgres.StopAsync();
    }
}