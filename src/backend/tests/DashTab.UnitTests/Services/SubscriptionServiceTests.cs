using DashTab.Application.Dtos;
using DashTab.Application.Interfaces;
using DashTab.Domain.Entities;
using DashTab.Domain.Enums;
using DashTab.Infrastructure.Persistence;
using DashTab.Infrastructure.Services;
using Microsoft.EntityFrameworkCore;

namespace DashTab.UnitTests.Services;

public class SubscriptionServiceTests
{
    private static readonly Guid TenantId = Guid.Parse("55555555-5555-5555-5555-555555555555");

    private sealed class StubCurrentUser : ICurrentUser
    {
        public Guid Id { get; } = Guid.NewGuid();
        public string? Email => "owner@example.com";
        public IReadOnlyList<string> Roles => ["Owner"];
        public Guid RestaurantId => TenantId;
    }

    private sealed class StubStripeService : IStripeService
    {
        public string CheckoutUrl { get; set; } = "https://checkout.stripe.test/session";
        public StripeSessionResult SessionResult { get; set; } = new(true, "cus_x", "sub_x", null);

        public Task<string> CreateCheckoutSessionAsync(Plan plan, Guid restaurantId, string customerEmail, CancellationToken ct = default)
            => Task.FromResult(CheckoutUrl);

        public Task<StripeSessionResult> GetSessionResultAsync(string sessionId, CancellationToken ct = default)
            => Task.FromResult(SessionResult);
    }

    private static DashTabDbContext NewDb()
    {
        var db = new DashTabDbContext(new DbContextOptionsBuilder<DashTabDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options);
        db.CurrentTenantId = TenantId;
        return db;
    }

    private static void SeedSubscription(DashTabDbContext db, SubscriptionStatus status, Plan plan, DateTime? periodEnd)
        => db.Subscriptions.Add(new Subscription
        {
            Id = Guid.NewGuid(), RestaurantId = TenantId, Plan = plan, Status = status,
            CurrentPeriodEnd = periodEnd, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow,
        });

    private static void SeedUser(DashTabDbContext db)
        => db.Users.Add(new User
        {
            Id = Guid.NewGuid(), FullName = "Staff", Email = $"{Guid.NewGuid():N}@x.com",
            Role = Role.Waiter, IsActive = true, RestaurantId = TenantId,
            CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow,
        });

    [Fact]
    public async Task CreateCheckoutAsync_creates_incomplete_subscription_and_returns_url()
    {
        await using var db = NewDb();
        var stripe = new StubStripeService { CheckoutUrl = "https://pay.test/abc" };
        var sut = new SubscriptionService(db, new StubCurrentUser(), stripe);

        var response = await sut.CreateCheckoutAsync(new CreateCheckoutRequest("Basic"));

        Assert.Equal("https://pay.test/abc", response.Url);
        var sub = await db.Subscriptions.IgnoreQueryFilters().SingleAsync(s => s.RestaurantId == TenantId);
        Assert.Equal(SubscriptionStatus.Incomplete, sub.Status);
        Assert.Equal(Plan.Basic, sub.Plan);
    }

    [Fact]
    public async Task ConfirmAsync_defaults_period_end_to_one_month_when_stripe_returns_null()
    {
        await using var db = NewDb();
        SeedSubscription(db, SubscriptionStatus.Incomplete, Plan.Pro, periodEnd: null);
        await db.SaveChangesAsync();
        var stripe = new StubStripeService { SessionResult = new StripeSessionResult(true, "cus_1", "sub_1", null) };
        var sut = new SubscriptionService(db, new StubCurrentUser(), stripe);

        var now = DateTime.UtcNow;
        var dto = await sut.ConfirmAsync(new ConfirmCheckoutRequest("sess_1"));

        Assert.Equal("active", dto.Status);
        Assert.True(dto.IsActive);
        Assert.NotNull(dto.CurrentPeriodEnd);
        Assert.InRange(dto.CurrentPeriodEnd!.Value, now.AddMonths(1).AddMinutes(-2), now.AddMonths(1).AddMinutes(2));
    }

    [Fact]
    public async Task ConfirmAsync_throws_when_payment_not_completed()
    {
        await using var db = NewDb();
        SeedSubscription(db, SubscriptionStatus.Incomplete, Plan.Basic, periodEnd: null);
        await db.SaveChangesAsync();
        var stripe = new StubStripeService { SessionResult = new StripeSessionResult(false, null, null, null) };
        var sut = new SubscriptionService(db, new StubCurrentUser(), stripe);

        await Assert.ThrowsAsync<InvalidOperationException>(() => sut.ConfirmAsync(new ConfirmCheckoutRequest("sess_1")));
    }

    [Fact]
    public async Task IsActiveAsync_true_when_active_and_not_expired()
    {
        await using var db = NewDb();
        SeedSubscription(db, SubscriptionStatus.Active, Plan.Basic, periodEnd: DateTime.UtcNow.AddDays(5));
        await db.SaveChangesAsync();
        var sut = new SubscriptionService(db, new StubCurrentUser(), new StubStripeService());

        Assert.True(await sut.IsActiveAsync(TenantId));
    }

    [Fact]
    public async Task IsActiveAsync_false_when_expired()
    {
        await using var db = NewDb();
        SeedSubscription(db, SubscriptionStatus.Active, Plan.Basic, periodEnd: DateTime.UtcNow.AddDays(-1));
        await db.SaveChangesAsync();
        var sut = new SubscriptionService(db, new StubCurrentUser(), new StubStripeService());

        Assert.False(await sut.IsActiveAsync(TenantId));
    }

    [Fact]
    public async Task IsActiveAsync_false_when_incomplete()
    {
        await using var db = NewDb();
        SeedSubscription(db, SubscriptionStatus.Incomplete, Plan.Basic, periodEnd: null);
        await db.SaveChangesAsync();
        var sut = new SubscriptionService(db, new StubCurrentUser(), new StubStripeService());

        Assert.False(await sut.IsActiveAsync(TenantId));
    }

    [Fact]
    public async Task GetCurrentAsync_reports_plan_limit_and_staff_usage()
    {
        await using var db = NewDb();
        SeedSubscription(db, SubscriptionStatus.Active, Plan.Pro, periodEnd: DateTime.UtcNow.AddDays(10));
        SeedUser(db);
        SeedUser(db);
        await db.SaveChangesAsync();
        var sut = new SubscriptionService(db, new StubCurrentUser(), new StubStripeService());

        var dto = await sut.GetCurrentAsync();

        Assert.NotNull(dto);
        Assert.Equal("pro", dto!.Plan);
        Assert.Equal(25, dto.StaffLimit);   // PlanLimits.MaxStaff(Pro)
        Assert.Equal(2, dto.StaffUsed);
    }

    [Fact]
    public async Task GetCurrentAsync_null_when_no_subscription()
    {
        await using var db = NewDb();
        var sut = new SubscriptionService(db, new StubCurrentUser(), new StubStripeService());

        Assert.Null(await sut.GetCurrentAsync());
    }
}
