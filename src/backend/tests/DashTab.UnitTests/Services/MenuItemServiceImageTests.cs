using DashTab.Application.Dtos;
using DashTab.Application.Interfaces;
using DashTab.Application.Mappings;
using DashTab.Application.Storage;
using DashTab.Domain.Entities;
using DashTab.Infrastructure.Persistence;
using DashTab.Infrastructure.Services;
using Hangfire;
using Microsoft.EntityFrameworkCore;

namespace DashTab.UnitTests.Services;

public class MenuItemServiceImageTests
{
    private sealed class FakeStorageService : IStorageService
    {
        public List<(string Bucket, string Key)> Deletes { get; } = [];
        public Func<string, string, StoredObjectInfo?>? StatHandler { get; set; }
        public string? LastContentType { get; private set; }

        public Task<PresignedUploadUrl> CreatePresignedUploadAsync(
            string bucket, string objectKey, TimeSpan expiry, string contentType, CancellationToken ct = default)
        {
            LastContentType = contentType;
            return Task.FromResult(new PresignedUploadUrl(
                $"https://example/upload/{objectKey}", objectKey, contentType, DateTimeOffset.UtcNow.Add(expiry)));
        }

        public string GetPublicUrl(string bucket, string objectKey) => $"https://public/{bucket}/{objectKey}";

        public Task DeleteAsync(string bucket, string objectKey, CancellationToken ct = default)
        {
            Deletes.Add((bucket, objectKey));
            return Task.CompletedTask;
        }

        public Task<StoredObjectInfo?> StatAsync(string bucket, string objectKey, CancellationToken ct = default)
            => Task.FromResult(StatHandler?.Invoke(bucket, objectKey));
    }

    private sealed class NoopCacheService : ICacheService
    {
        public Task<T?> GetAsync<T>(string key, CancellationToken ct = default) where T : class => Task.FromResult<T?>(null);
        public Task SetAsync<T>(string key, T value, TimeSpan ttl, CancellationToken ct = default) where T : class => Task.CompletedTask;
        public Task RemoveAsync(string key, CancellationToken ct = default) => Task.CompletedTask;
        public Task RemoveManyAsync(IEnumerable<string> keys, CancellationToken ct = default) => Task.CompletedTask;
    }

    // Fixed tenant shared by the seeded data, the DbContext filter, and the current user
    // so the strict tenant query filter (RestaurantId == CurrentTenantId) resolves.
    private static readonly Guid TenantId = Guid.Parse("11111111-1111-1111-1111-111111111111");

    private static DashTabDbContext NewDb()
    {
        var db = new DashTabDbContext(new DbContextOptionsBuilder<DashTabDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options);
        db.CurrentTenantId = TenantId;
        return db;
    }

    private static MenuItem SeedItem(DashTabDbContext db, string? imageKey = null)
    {
        var category = new MenuCategory { Id = Guid.NewGuid(), Name = "Drinks", DisplayOrder = 1, RestaurantId = TenantId };
        var item = new MenuItem
        {
            Id = Guid.NewGuid(),
            CategoryId = category.Id,
            Name = "Espresso",
            Description = "Strong coffee",
            Price = 2.50m,
            IsAvailable = true,
            ImageObjectKey = imageKey,
            Category = category,
            RestaurantId = TenantId,
        };
        db.MenuCategories.Add(category);
        db.MenuItems.Add(item);
        db.SaveChanges();
        return item;
    }

    private sealed class StubCurrentUser : ICurrentUser
    {
        public Guid Id { get; } = Guid.NewGuid();
        public string? Email => "test@example.com";
        public IReadOnlyList<string> Roles => [];
        public Guid RestaurantId => TenantId;
    }

    private static MenuItemService NewSut(DashTabDbContext db, FakeStorageService storage)
        => new(db, new NoopCacheService(), new MenuItemMapper(), storage, new StubCurrentUser(),
               new NoopRecommendationService(), new NoopBackgroundJobClient());

    private sealed class NoopBackgroundJobClient : IBackgroundJobClient
    {
        public string Create(Hangfire.Common.Job job, Hangfire.States.IState state) => string.Empty;
        public bool ChangeState(string jobId, Hangfire.States.IState state, string? expectedStateName) => true;
    }

    private sealed class NoopRecommendationService : DashTab.Application.Interfaces.IRecommendationService
    {
        public Task<DashTab.Application.Dtos.RecommendationResponse> RecommendAsync(Guid restaurantId, string query, CancellationToken ct = default)
            => Task.FromResult(new DashTab.Application.Dtos.RecommendationResponse(null, []));
        public Task BackfillEmbeddingsAsync(Guid restaurantId, CancellationToken ct = default) => Task.CompletedTask;
        public Task EmbedItemAsync(Guid menuItemId, CancellationToken ct = default) => Task.CompletedTask;
    }

    [Fact]
    public async Task RequestImageUpload_ItemNotFound_ReturnsNull()
    {
        await using var db = NewDb();
        var sut = NewSut(db, new FakeStorageService());

        var result = await sut.RequestImageUploadAsync(Guid.NewGuid(), "png");

        Assert.Null(result);
    }

    [Theory]
    [InlineData("exe")]
    [InlineData("svg")]
    [InlineData("")]
    public async Task RequestImageUpload_UnsupportedExtension_Throws(string ext)
    {
        await using var db = NewDb();
        var item = SeedItem(db);
        var sut = NewSut(db, new FakeStorageService());

        await Assert.ThrowsAsync<InvalidOperationException>(() =>
            sut.RequestImageUploadAsync(item.Id, ext));
    }

    [Theory]
    [InlineData("png", "image/png")]
    [InlineData("jpg", "image/jpeg")]
    [InlineData("jpeg", "image/jpeg")]
    [InlineData("webp", "image/webp")]
    public async Task RequestImageUpload_ValidExtension_ReturnsScopedKey_AndBindsContentType(string ext, string expectedContentType)
    {
        await using var db = NewDb();
        var item = SeedItem(db);
        var storage = new FakeStorageService();
        var sut = NewSut(db, storage);

        var result = await sut.RequestImageUploadAsync(item.Id, ext);

        Assert.NotNull(result);
        Assert.StartsWith($"menu-items/{item.Id}/", result!.ObjectKey);
        Assert.EndsWith($".{ext}", result.ObjectKey);
        Assert.Equal(expectedContentType, result.ContentType);
        Assert.Equal(expectedContentType, storage.LastContentType);
    }

    [Fact]
    public async Task ConfirmImage_KeyForDifferentItem_ReturnsNull_AndDoesNotTouchStorage()
    {
        await using var db = NewDb();
        var item = SeedItem(db);
        var storage = new FakeStorageService
        {
            StatHandler = (_, _) => new StoredObjectInfo(100, "image/png"),
        };
        var sut = NewSut(db, storage);

        var foreignKey = $"menu-items/{Guid.NewGuid()}/{Guid.NewGuid()}.png";

        var result = await sut.ConfirmImageAsync(item.Id, foreignKey);

        Assert.Null(result);
        Assert.Empty(storage.Deletes);
    }

    [Fact]
    public async Task ConfirmImage_ItemNotFound_ReturnsNull()
    {
        await using var db = NewDb();
        var sut = NewSut(db, new FakeStorageService());
        var itemId = Guid.NewGuid();
        var key = $"menu-items/{itemId}/{Guid.NewGuid()}.png";

        var result = await sut.ConfirmImageAsync(itemId, key);

        Assert.Null(result);
    }

    [Fact]
    public async Task ConfirmImage_ObjectNotInStorage_ReturnsNull()
    {
        await using var db = NewDb();
        var item = SeedItem(db);
        var storage = new FakeStorageService { StatHandler = (_, _) => null };
        var sut = NewSut(db, storage);
        var key = $"menu-items/{item.Id}/{Guid.NewGuid()}.png";

        var result = await sut.ConfirmImageAsync(item.Id, key);

        Assert.Null(result);
        Assert.Empty(storage.Deletes);
    }

    [Fact]
    public async Task ConfirmImage_Oversized_DeletesObject_Throws_AndDoesNotPersist()
    {
        await using var db = NewDb();
        var item = SeedItem(db);
        var storage = new FakeStorageService
        {
            StatHandler = (_, _) => new StoredObjectInfo(ImagePolicy.MaxBytes + 1, "image/png"),
        };
        var sut = NewSut(db, storage);
        var key = $"menu-items/{item.Id}/{Guid.NewGuid()}.png";

        await Assert.ThrowsAsync<InvalidOperationException>(() => sut.ConfirmImageAsync(item.Id, key));

        Assert.Contains(storage.Deletes, d => d.Key == key);

        var reloaded = await db.MenuItems.FindAsync(item.Id);
        Assert.Null(reloaded!.ImageObjectKey);
    }

    [Fact]
    public async Task ConfirmImage_NonImageContentType_DeletesObject_AndThrows()
    {
        await using var db = NewDb();
        var item = SeedItem(db);
        var storage = new FakeStorageService
        {
            StatHandler = (_, _) => new StoredObjectInfo(100, "application/octet-stream"),
        };
        var sut = NewSut(db, storage);
        var key = $"menu-items/{item.Id}/{Guid.NewGuid()}.png";

        await Assert.ThrowsAsync<InvalidOperationException>(() => sut.ConfirmImageAsync(item.Id, key));

        Assert.Contains(storage.Deletes, d => d.Key == key);
    }

    [Fact]
    public async Task ConfirmImage_HappyPath_PersistsKey_AndDeletesOldImage()
    {
        await using var db = NewDb();
        var oldKey = $"menu-items/{Guid.NewGuid()}/old.png";
        var item = SeedItem(db, imageKey: oldKey);
        var storage = new FakeStorageService
        {
            StatHandler = (_, _) => new StoredObjectInfo(100, "image/png"),
        };
        var sut = NewSut(db, storage);
        var newKey = $"menu-items/{item.Id}/{Guid.NewGuid()}.png";

        var result = await sut.ConfirmImageAsync(item.Id, newKey);

        Assert.NotNull(result);
        Assert.Contains(newKey, result!.ImageUrl);

        var reloaded = await db.MenuItems.FindAsync(item.Id);
        Assert.Equal(newKey, reloaded!.ImageObjectKey);

        Assert.Contains(storage.Deletes, d => d.Key == oldKey);
    }

    [Fact]
    public async Task RemoveImage_ItemNotFound_ReturnsFalse()
    {
        await using var db = NewDb();
        var sut = NewSut(db, new FakeStorageService());

        var ok = await sut.RemoveImageAsync(Guid.NewGuid());

        Assert.False(ok);
    }

    [Fact]
    public async Task RemoveImage_NoImage_ReturnsFalse_AndDoesNotCallStorage()
    {
        await using var db = NewDb();
        var item = SeedItem(db);
        var storage = new FakeStorageService();
        var sut = NewSut(db, storage);

        var ok = await sut.RemoveImageAsync(item.Id);

        Assert.False(ok);
        Assert.Empty(storage.Deletes);
    }

    [Fact]
    public async Task RemoveImage_HappyPath_DeletesAndClearsKey()
    {
        await using var db = NewDb();
        var key = $"menu-items/{Guid.NewGuid()}/img.png";
        var item = SeedItem(db, imageKey: key);
        var storage = new FakeStorageService();
        var sut = NewSut(db, storage);

        var ok = await sut.RemoveImageAsync(item.Id);

        Assert.True(ok);
        Assert.Contains(storage.Deletes, d => d.Key == key);

        var reloaded = await db.MenuItems.FindAsync(item.Id);
        Assert.Null(reloaded!.ImageObjectKey);
    }

    [Fact]
    public async Task Delete_WithImage_AlsoRemovesObjectFromStorage()
    {
        await using var db = NewDb();
        var key = $"menu-items/{Guid.NewGuid()}/img.png";
        var item = SeedItem(db, imageKey: key);
        var storage = new FakeStorageService();
        var sut = NewSut(db, storage);

        var ok = await sut.DeleteAsync(item.Id);

        Assert.True(ok);
        Assert.Contains(storage.Deletes, d => d.Key == key);
    }

    [Fact]
    public async Task Delete_WithoutImage_DoesNotCallStorage()
    {
        await using var db = NewDb();
        var item = SeedItem(db);
        var storage = new FakeStorageService();
        var sut = NewSut(db, storage);

        var ok = await sut.DeleteAsync(item.Id);

        Assert.True(ok);
        Assert.Empty(storage.Deletes);
    }
}
