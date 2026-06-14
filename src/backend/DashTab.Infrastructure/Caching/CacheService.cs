using System.Text.Json;
using DashTab.Application.Interfaces;
using Microsoft.Extensions.Caching.Distributed;
using Microsoft.Extensions.Logging;

namespace DashTab.Infrastructure.Caching;

public class CacheService(IDistributedCache cache, ILogger<CacheService> logger) : ICacheService
{
    private static readonly JsonSerializerOptions JsonOpts = new(JsonSerializerDefaults.Web);

    public async Task<T?> GetAsync<T>(string key, CancellationToken ct = default) where T : class
    {
        try
        {
            var bytes = await cache.GetAsync(key, ct);
            return bytes is null ? null : JsonSerializer.Deserialize<T>(bytes, JsonOpts);
        }
        catch (Exception ex)
        {
            logger.LogWarning(ex, "Cache GET failed for {Key}", key);
            return null;
        }
    }

    public async Task SetAsync<T>(string key, T value, TimeSpan ttl, CancellationToken ct = default) where T : class
    {
        try
        {
            var bytes = JsonSerializer.SerializeToUtf8Bytes(value, JsonOpts);
            var options = new DistributedCacheEntryOptions { AbsoluteExpirationRelativeToNow = ttl };
            await cache.SetAsync(key, bytes, options, ct);
        }
        catch (Exception ex)
        {
            logger.LogWarning(ex, "Cache SET failed for {Key}", key);
        }
    }

    public async Task RemoveAsync(string key, CancellationToken ct = default)
    {
        try
        {
            await cache.RemoveAsync(key, ct);
        }
        catch (Exception ex)
        {
            logger.LogWarning(ex, "Cache REMOVE failed for {Key}", key);
        }
    }

    public async Task RemoveManyAsync(IEnumerable<string> keys, CancellationToken ct = default)
    {
        foreach (var key in keys)
            await RemoveAsync(key, ct);
    }
}
