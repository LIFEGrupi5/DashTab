using DashTab.Application.Interfaces;
using DashTab.Domain.Entities;
using DashTab.Domain.Enums;
using DashTab.Infrastructure.Persistence;
using DashTab.Infrastructure.Services;
using Microsoft.EntityFrameworkCore;

namespace DashTab.UnitTests.Services;

// Guards the behaviour that the CurrentUser.Roles fix restores: ScheduleService limits
// workers (Waiter/Kitchen) to their OWN published shifts. With the old empty-Roles bug
// this branch never ran and every worker saw the whole restaurant's schedule.
public class ScheduleServiceTests
{
    private static readonly Guid TenantId = Guid.Parse("22222222-2222-2222-2222-222222222222");
    private static readonly DateOnly Week = new(2026, 6, 8); // a Monday

    private sealed class StubCurrentUser(Guid id, params string[] roles) : ICurrentUser
    {
        public Guid Id { get; } = id;
        public string? Email => "u@example.com";
        public IReadOnlyList<string> Roles { get; } = roles;
        public Guid RestaurantId => TenantId;
    }

    private static DashTabDbContext NewDb()
    {
        var db = new DashTabDbContext(new DbContextOptionsBuilder<DashTabDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options);
        db.CurrentTenantId = TenantId;
        return db;
    }

    private static User SeedUser(DashTabDbContext db, string name)
    {
        var u = new User
        {
            Id = Guid.NewGuid(),
            FullName = name,
            Email = $"{name}@example.com",
            Role = Role.Waiter,
            IsActive = true,
            RestaurantId = TenantId,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow,
        };
        db.Users.Add(u);
        return u;
    }

    private static void SeedShift(DashTabDbContext db, User user, DayOfWeek day, bool published)
        => db.WorkShifts.Add(new WorkShift
        {
            Id = Guid.NewGuid(),
            RestaurantId = TenantId,
            UserId = user.Id,
            User = user,
            WeekStartDate = Week,
            DayOfWeek = day,
            StartTime = new TimeOnly(9, 0),
            EndTime = new TimeOnly(17, 0),
            IsPublished = published,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow,
        });

    [Fact]
    public async Task Waiter_sees_only_their_own_published_shifts()
    {
        await using var db = NewDb();
        var waiter = SeedUser(db, "wendy");
        var other = SeedUser(db, "olive");
        SeedShift(db, waiter, DayOfWeek.Monday, published: true);    // visible
        SeedShift(db, waiter, DayOfWeek.Tuesday, published: false);  // hidden — not published
        SeedShift(db, other, DayOfWeek.Monday, published: true);     // hidden — someone else's
        await db.SaveChangesAsync();

        var sut = new ScheduleService(db, new StubCurrentUser(waiter.Id, "Waiter"));
        var shifts = await sut.GetShiftsAsync(Week);

        var shift = Assert.Single(shifts);
        Assert.Equal(waiter.Id, shift.UserId);
        Assert.True(shift.IsPublished);
    }

    [Fact]
    public async Task Manager_sees_all_shifts_including_unpublished()
    {
        await using var db = NewDb();
        var waiter = SeedUser(db, "wendy");
        var other = SeedUser(db, "olive");
        SeedShift(db, waiter, DayOfWeek.Monday, published: true);
        SeedShift(db, waiter, DayOfWeek.Tuesday, published: false);
        SeedShift(db, other, DayOfWeek.Monday, published: true);
        await db.SaveChangesAsync();

        var sut = new ScheduleService(db, new StubCurrentUser(Guid.NewGuid(), "Manager"));
        var shifts = await sut.GetShiftsAsync(Week);

        Assert.Equal(3, shifts.Count);
    }
}
