using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using DashTab.Domain.Entities;
using DashTab.Domain.Enums;
using DashTab.Infrastructure.Persistence;
using FluentAssertions;
using Microsoft.Extensions.DependencyInjection;

namespace DashTab.IntegrationTests;

[Collection("Api")]
public class ApiTests(DashTabApiFactory factory)
{
    private HttpClient AsOwner()
    {
        var client = factory.CreateClient();
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", $"Owner:{_userId}");
        return client;
    }

    private static readonly Guid _userId = Guid.NewGuid();
    private static bool _seeded = false;
    private static readonly SemaphoreSlim _seedLock = new(1, 1);

    private async Task SeedAsync()
    {
        await _seedLock.WaitAsync();
        try
        {
            if (_seeded) return;
            using var scope = factory.Services.CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<DashTabDbContext>();

            db.Users.Add(new User
            {
                Id = _userId,
                FullName = "Test Owner",
                Email = "testowner@dashtab.dev",
                Role = Role.Owner,
                IsActive = true,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow,
            });

            await db.SaveChangesAsync();
            _seeded = true;
        }
        finally { _seedLock.Release(); }
    }

    private async Task<Guid> SeedCategoryAsync()
    {
        using var scope = factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<DashTabDbContext>();
        var id = Guid.NewGuid();
        db.MenuCategories.Add(new MenuCategory
        {
            Id = id,
            Name = $"Cat-{id:N}",
            DisplayOrder = 0,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow,
        });
        await db.SaveChangesAsync();
        return id;
    }

    // ── Menu CRUD ────────────────────────────────────────────────────────────────

    [Fact]
    public async Task GetMenuItems_Returns200()
    {
        var response = await AsOwner().GetAsync("/api/v1/menu-items");
        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task GetMenuItemById_NotFound_Returns404()
    {
        var response = await AsOwner().GetAsync($"/api/v1/menu-items/{Guid.NewGuid()}");
        response.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    // ── Validation 422 shape ─────────────────────────────────────────────────────

    [Fact]
    public async Task CreateMenuItem_WithEmptyBody_Returns422WithErrors()
    {
        var response = await AsOwner().PostAsJsonAsync("/api/v1/menu-items", new { });
        response.StatusCode.Should().Be(HttpStatusCode.UnprocessableEntity);

        var body = await response.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(body);
        doc.RootElement.TryGetProperty("errors", out _).Should().BeTrue("response should contain 'errors' field");
    }

    [Fact]
    public async Task CreateMenuItem_WithNameTooShort_Returns422()
    {
        var response = await AsOwner().PostAsJsonAsync("/api/v1/menu-items", new
        {
            name = "A",
            price = 5.0,
            categoryId = Guid.NewGuid()
        });
        response.StatusCode.Should().Be(HttpStatusCode.UnprocessableEntity);
    }

    [Fact]
    public async Task CreateMenuItem_WithNegativePrice_Returns422()
    {
        var response = await AsOwner().PostAsJsonAsync("/api/v1/menu-items", new
        {
            name = "Valid Name",
            price = -1.0,
            categoryId = Guid.NewGuid()
        });
        response.StatusCode.Should().Be(HttpStatusCode.UnprocessableEntity);
    }

    // ── Order state machine ──────────────────────────────────────────────────────

    [Fact]
    public async Task UpdateOrderStatus_InvalidTransition_Returns422()
    {
        await SeedAsync();

        // Directly seed an order in New status
        var orderId = Guid.NewGuid();
        using (var scope = factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<DashTabDbContext>();
            db.Orders.Add(new Order
            {
                Id = orderId,
                OrderNumber = "ORD-001",
                TableLabel = "T1",
                Status = OrderStatus.New,
                TotalAmount = 0,
                CreatedById = _userId,
                CreatedByName = "Test Owner",
                PlacedAt = DateTime.UtcNow,
                StageEnteredAt = DateTime.UtcNow,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow,
                Items = [],
            });
            await db.SaveChangesAsync();
        }

        // New → Completed is not an allowed transition
        var response = await AsOwner().PatchAsJsonAsync(
            $"/api/v1/orders/{orderId}/status",
            new { status = "Completed" });

        response.StatusCode.Should().Be(HttpStatusCode.UnprocessableEntity);
    }

    [Fact]
    public async Task UpdateOrderStatus_ValidTransition_Returns200()
    {
        await SeedAsync();

        var orderId = Guid.NewGuid();
        using (var scope = factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<DashTabDbContext>();
            db.Orders.Add(new Order
            {
                Id = orderId,
                OrderNumber = "ORD-002",
                TableLabel = "T2",
                Status = OrderStatus.New,
                TotalAmount = 0,
                CreatedById = _userId,
                CreatedByName = "Test Owner",
                PlacedAt = DateTime.UtcNow,
                StageEnteredAt = DateTime.UtcNow,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow,
                Items = [],
            });
            await db.SaveChangesAsync();
        }

        // New → Preparing is a valid transition
        var response = await AsOwner().PatchAsJsonAsync(
            $"/api/v1/orders/{orderId}/status",
            new { status = "Preparing" });

        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    // ── Menu mutations (POST 201, PUT 200, DELETE 204) ───────────────────────────

    [Fact]
    public async Task CreateMenuItem_AsOwner_Returns201WithBody()
    {
        var categoryId = await SeedCategoryAsync();

        var response = await AsOwner().PostAsJsonAsync("/api/v1/menu-items", new
        {
            name = "Test Burger",
            price = 9.99,
            categoryId,
            description = "Beef patty"
        });

        response.StatusCode.Should().Be(HttpStatusCode.Created);
        var body = await response.Content.ReadFromJsonAsync<JsonElement>();
        body.GetProperty("name").GetString().Should().Be("Test Burger");
        body.GetProperty("price").GetDecimal().Should().Be(9.99m);
    }

    [Fact]
    public async Task UpdateMenuItem_AsOwner_Returns200()
    {
        var categoryId = await SeedCategoryAsync();

        var createResp = await AsOwner().PostAsJsonAsync("/api/v1/menu-items", new
        {
            name = "Old Name", price = 5.0, categoryId, description = "original"
        });
        var id = (await createResp.Content.ReadFromJsonAsync<JsonElement>())
            .GetProperty("id").GetGuid();

        var updateResp = await AsOwner().PutAsJsonAsync($"/api/v1/menu-items/{id}", new
        {
            name = "New Name", price = 7.5, categoryId, description = "updated", available = true
        });

        updateResp.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Fact]
    public async Task DeleteMenuItem_AsOwner_Returns204AndSoftDeletes()
    {
        var categoryId = await SeedCategoryAsync();

        var createResp = await AsOwner().PostAsJsonAsync("/api/v1/menu-items", new
        {
            name = "ToDelete", price = 1.0, categoryId, description = "to be deleted"
        });
        var id = (await createResp.Content.ReadFromJsonAsync<JsonElement>())
            .GetProperty("id").GetGuid();

        var deleteResp = await AsOwner().DeleteAsync($"/api/v1/menu-items/{id}");
        deleteResp.StatusCode.Should().Be(HttpStatusCode.NoContent);

        // Soft delete: subsequent GET should 404 (HasQueryFilter strips IsDeleted rows)
        var afterDelete = await AsOwner().GetAsync($"/api/v1/menu-items/{id}");
        afterDelete.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }
}
