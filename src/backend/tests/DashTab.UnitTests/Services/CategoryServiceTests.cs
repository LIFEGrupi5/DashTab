using DashTab.Application.Dtos;
using DashTab.Application.Interfaces;
using DashTab.Application.Mappings;
using DashTab.Domain.Entities;
using DashTab.Infrastructure.Persistence;
using DashTab.Infrastructure.Services;
using Microsoft.EntityFrameworkCore;

namespace DashTab.UnitTests.Services;

public class CategoryServiceTests
{
    private static readonly Guid TenantId = Guid.Parse("44444444-4444-4444-4444-444444444444");

    private sealed class StubCurrentUser : ICurrentUser
    {
        public Guid Id { get; } = Guid.NewGuid();
        public string? Email => "owner@example.com";
        public IReadOnlyList<string> Roles => ["Owner"];
        public Guid RestaurantId => TenantId;
    }

    private sealed class NoopCacheService : ICacheService
    {
        public Task<T?> GetAsync<T>(string key, CancellationToken ct = default) where T : class => Task.FromResult<T?>(null);
        public Task SetAsync<T>(string key, T value, TimeSpan ttl, CancellationToken ct = default) where T : class => Task.CompletedTask;
        public Task RemoveAsync(string key, CancellationToken ct = default) => Task.CompletedTask;
        public Task RemoveManyAsync(IEnumerable<string> keys, CancellationToken ct = default) => Task.CompletedTask;
    }

    private static DashTabDbContext NewDb()
    {
        var db = new DashTabDbContext(new DbContextOptionsBuilder<DashTabDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options);
        db.CurrentTenantId = TenantId;
        return db;
    }

    private static CategoryService NewSut(DashTabDbContext db)
        => new(db, new NoopCacheService(), new MenuCategoryMapper(), new StubCurrentUser());

    [Fact]
    public async Task CreateAsync_stamps_tenant_and_persists()
    {
        await using var db = NewDb();
        var sut = NewSut(db);

        var dto = await sut.CreateAsync(new CreateCategoryRequest("Drinks", DisplayOrder: 2));

        Assert.Equal("Drinks", dto.Name);
        Assert.Equal(2, dto.DisplayOrder);

        var entity = await db.MenuCategories.IgnoreQueryFilters().FirstAsync(c => c.Id == dto.Id);
        Assert.Equal(TenantId, entity.RestaurantId);
        Assert.False(entity.IsDeleted);
    }

    [Fact]
    public async Task ListAsync_returns_categories_ordered_by_display_order()
    {
        await using var db = NewDb();
        var sut = NewSut(db);
        await sut.CreateAsync(new CreateCategoryRequest("Mains", DisplayOrder: 2));
        await sut.CreateAsync(new CreateCategoryRequest("Starters", DisplayOrder: 1));
        await sut.CreateAsync(new CreateCategoryRequest("Desserts", DisplayOrder: 3));

        var list = (await sut.ListAsync()).ToList();

        Assert.Equal(new[] { "Starters", "Mains", "Desserts" }, list.Select(c => c.Name));
    }

    [Fact]
    public async Task GetByIdAsync_returns_null_when_missing()
    {
        await using var db = NewDb();
        var sut = NewSut(db);

        Assert.Null(await sut.GetByIdAsync(Guid.NewGuid()));
    }

    [Fact]
    public async Task UpdateAsync_changes_name_and_order()
    {
        await using var db = NewDb();
        var sut = NewSut(db);
        var created = await sut.CreateAsync(new CreateCategoryRequest("Old", DisplayOrder: 1));

        var updated = await sut.UpdateAsync(created.Id, new UpdateCategoryRequest("New", DisplayOrder: 5));

        Assert.NotNull(updated);
        Assert.Equal("New", updated!.Name);
        Assert.Equal(5, updated.DisplayOrder);
    }

    [Fact]
    public async Task UpdateAsync_returns_null_when_missing()
    {
        await using var db = NewDb();
        var sut = NewSut(db);

        Assert.Null(await sut.UpdateAsync(Guid.NewGuid(), new UpdateCategoryRequest("X", 1)));
    }

    [Fact]
    public async Task DeleteAsync_soft_deletes_and_hides_from_list()
    {
        await using var db = NewDb();
        var sut = NewSut(db);
        var created = await sut.CreateAsync(new CreateCategoryRequest("Temp", DisplayOrder: 1));

        var ok = await sut.DeleteAsync(created.Id);

        Assert.True(ok);
        Assert.Empty(await sut.ListAsync());
        var entity = await db.MenuCategories.IgnoreQueryFilters().FirstAsync(c => c.Id == created.Id);
        Assert.True(entity.IsDeleted);   // soft-delete, not a hard delete
    }

    [Fact]
    public async Task DeleteAsync_with_menu_items_throws()
    {
        await using var db = NewDb();
        var sut = NewSut(db);
        var created = await sut.CreateAsync(new CreateCategoryRequest("HasItems", DisplayOrder: 1));
        db.MenuItems.Add(new MenuItem
        {
            Id = Guid.NewGuid(), CategoryId = created.Id, Name = "Burger", Price = 9.5m,
            IsAvailable = true, RestaurantId = TenantId, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow,
        });
        await db.SaveChangesAsync();

        await Assert.ThrowsAsync<InvalidOperationException>(() => sut.DeleteAsync(created.Id));
    }

    [Fact]
    public async Task DeleteAsync_returns_false_when_missing()
    {
        await using var db = NewDb();
        var sut = NewSut(db);

        Assert.False(await sut.DeleteAsync(Guid.NewGuid()));
    }
}
