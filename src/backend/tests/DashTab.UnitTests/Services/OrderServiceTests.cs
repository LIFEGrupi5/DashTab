using DashTab.Application.Dtos;
using DashTab.Application.Interfaces;
using DashTab.Application.Mappings;
using DashTab.Domain.Entities;
using DashTab.Domain.Enums;
using DashTab.Domain.Exceptions;
using DashTab.Infrastructure.Persistence;
using DashTab.Infrastructure.Services;
using Hangfire;
using Hangfire.Common;
using Hangfire.States;
using Microsoft.EntityFrameworkCore;

namespace DashTab.UnitTests.Services;

public class OrderServiceTests
{
    private static readonly Guid TenantId = Guid.Parse("33333333-3333-3333-3333-333333333333");

    private sealed class StubCurrentUser(Guid id) : ICurrentUser
    {
        public Guid Id { get; } = id;
        public string? Email => "owner@example.com";
        public IReadOnlyList<string> Roles => ["Owner"];
        public Guid RestaurantId => TenantId;
    }

    // Hangfire's IBackgroundJobClient — the Enqueue<T>(...) the service calls is an
    // extension that funnels through Create, so counting Create calls verifies enqueues.
    private sealed class FakeJobClient : IBackgroundJobClient
    {
        public int CreatedCount { get; private set; }
        public string Create(Job job, IState state) { CreatedCount++; return Guid.NewGuid().ToString(); }
        public bool ChangeState(string jobId, IState state, string expectedState) => true;
    }

    private sealed class FakeEventPublisher : IEventPublisher
    {
        public List<(object Event, string RoutingKey)> Published { get; } = [];
        public Task PublishAsync<T>(T @event, string routingKey, CancellationToken ct = default) where T : class
        {
            Published.Add((@event, routingKey));
            return Task.CompletedTask;
        }
    }

    private static DashTabDbContext NewDb()
    {
        var db = new DashTabDbContext(new DbContextOptionsBuilder<DashTabDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options);
        db.CurrentTenantId = TenantId;
        return db;
    }

    private sealed record Sut(OrderService Service, FakeJobClient Jobs, FakeEventPublisher Events, Guid UserId);

    private static Sut NewSut(DashTabDbContext db)
    {
        var userId = Guid.NewGuid();
        var jobs = new FakeJobClient();
        var events = new FakeEventPublisher();
        var service = new OrderService(db, new OrderMapper(), jobs, events, new StubCurrentUser(userId));
        return new Sut(service, jobs, events, userId);
    }

    private static void SeedUser(DashTabDbContext db, Guid id)
        => db.Users.Add(new User
        {
            Id = id, FullName = "Olivia Owner", Email = "owner@example.com",
            Role = Role.Owner, IsActive = true, RestaurantId = TenantId,
            CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow,
        });

    private static MenuItem SeedItem(DashTabDbContext db, decimal price)
    {
        var cat = new MenuCategory
        {
            Id = Guid.NewGuid(), Name = $"Cat-{Guid.NewGuid():N}", DisplayOrder = 1,
            RestaurantId = TenantId, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow,
        };
        var item = new MenuItem
        {
            Id = Guid.NewGuid(), CategoryId = cat.Id, Category = cat, Name = "Item", Price = price,
            IsAvailable = true, RestaurantId = TenantId, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow,
        };
        db.MenuCategories.Add(cat);
        db.MenuItems.Add(item);
        return item;
    }

    private static Order SeedOrder(DashTabDbContext db, OrderStatus status, Guid userId)
    {
        var now = DateTime.UtcNow;
        var order = new Order
        {
            Id = Guid.NewGuid(), OrderNumber = Guid.NewGuid().ToString("N")[..6], TableLabel = "T-1",
            Status = status, TotalAmount = 10m, CreatedById = userId, CreatedByName = "Olivia Owner",
            PlacedAt = now, StageEnteredAt = now, CreatedAt = now, UpdatedAt = now, RestaurantId = TenantId,
        };
        db.Orders.Add(order);
        return order;
    }

    [Fact]
    public async Task CreateAsync_computes_total_stamps_tenant_and_emits_side_effects()
    {
        await using var db = NewDb();
        var sut = NewSut(db);
        SeedUser(db, sut.UserId);
        var a = SeedItem(db, 2.50m);
        var b = SeedItem(db, 4.00m);
        await db.SaveChangesAsync();

        var request = new CreateOrderRequest("5", null, new[]
        {
            new CreateOrderItemRequest(a.Id, 2),   // 5.00
            new CreateOrderItemRequest(b.Id, 1),   // 4.00
        });

        var dto = await sut.Service.CreateAsync(request, sut.UserId);

        Assert.Equal(9.00m, dto.TotalAmount);
        Assert.Equal(TenantId, dto.RestaurantId);
        Assert.Equal("new", dto.Status);
        Assert.Equal(2, dto.Items.Count());
        Assert.Equal(1, sut.Jobs.CreatedCount);   // confirmation-email job enqueued
        Assert.Single(sut.Events.Published);      // OrderPlaced event published
    }

    [Fact]
    public async Task CreateAsync_unknown_menu_item_throws()
    {
        await using var db = NewDb();
        var sut = NewSut(db);
        SeedUser(db, sut.UserId);
        await db.SaveChangesAsync();

        var request = new CreateOrderRequest("5", null, new[] { new CreateOrderItemRequest(Guid.NewGuid(), 1) });

        await Assert.ThrowsAsync<InvalidOperationException>(() => sut.Service.CreateAsync(request, sut.UserId));
    }

    [Fact]
    public async Task CreateAsync_unknown_user_throws()
    {
        await using var db = NewDb();
        var sut = NewSut(db);   // no user seeded
        await db.SaveChangesAsync();

        var request = new CreateOrderRequest("5", null, new[] { new CreateOrderItemRequest(Guid.NewGuid(), 1) });

        await Assert.ThrowsAsync<InvalidOperationException>(() => sut.Service.CreateAsync(request, sut.UserId));
    }

    [Fact]
    public async Task UpdateStatusAsync_valid_transition_advances_status()
    {
        await using var db = NewDb();
        var sut = NewSut(db);
        var order = SeedOrder(db, OrderStatus.New, sut.UserId);
        await db.SaveChangesAsync();

        var dto = await sut.Service.UpdateStatusAsync(order.Id, "preparing");

        Assert.NotNull(dto);
        Assert.Equal("preparing", dto!.Status);
    }

    [Fact]
    public async Task UpdateStatusAsync_forbidden_transition_throws()
    {
        await using var db = NewDb();
        var sut = NewSut(db);
        var order = SeedOrder(db, OrderStatus.New, sut.UserId);
        await db.SaveChangesAsync();

        // New may only go to Preparing or Cancelled — never straight to Ready.
        await Assert.ThrowsAsync<InvalidStateTransitionException>(
            () => sut.Service.UpdateStatusAsync(order.Id, "ready"));
    }

    [Fact]
    public async Task UpdateStatusAsync_unknown_order_returns_null()
    {
        await using var db = NewDb();
        var sut = NewSut(db);

        var dto = await sut.Service.UpdateStatusAsync(Guid.NewGuid(), "preparing");

        Assert.Null(dto);
    }

    [Fact]
    public async Task CancelAsync_completed_order_throws()
    {
        await using var db = NewDb();
        var sut = NewSut(db);
        var order = SeedOrder(db, OrderStatus.Completed, sut.UserId);
        await db.SaveChangesAsync();

        await Assert.ThrowsAsync<InvalidStateTransitionException>(() => sut.Service.CancelAsync(order.Id));
    }

    [Fact]
    public async Task CancelAsync_active_order_succeeds()
    {
        await using var db = NewDb();
        var sut = NewSut(db);
        var order = SeedOrder(db, OrderStatus.New, sut.UserId);
        await db.SaveChangesAsync();

        var dto = await sut.Service.CancelAsync(order.Id);

        Assert.NotNull(dto);
        Assert.Equal("cancelled", dto!.Status);
    }

    [Fact]
    public async Task ListAsync_paginates_and_reports_total()
    {
        await using var db = NewDb();
        var sut = NewSut(db);
        SeedOrder(db, OrderStatus.New, sut.UserId);
        SeedOrder(db, OrderStatus.Preparing, sut.UserId);
        SeedOrder(db, OrderStatus.Ready, sut.UserId);
        await db.SaveChangesAsync();

        var page = await sut.Service.ListAsync(status: null, skip: 0, take: 2);

        Assert.Equal(3, page.Total);
        Assert.Equal(2, page.Items.Count());
    }
}
