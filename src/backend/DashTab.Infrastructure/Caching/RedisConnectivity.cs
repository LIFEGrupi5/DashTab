using StackExchange.Redis;

namespace DashTab.Infrastructure.Caching;

// The SignalR Redis backplane, unlike the cache (which falls back to in-memory),
// has no graceful degradation: a Redis that is unreachable or rejects auth makes
// every hub connection abort with WebSocket close 1011, which the browser then
// reconnect-storms. The API probes Redis with this helper at startup and only wires
// the backplane when Redis actually answers — otherwise it runs backplane-less
// (correct for a single replica; loses only cross-pod broadcast fanout when scaled).
public static class RedisConnectivity
{
    // Attempts a bounded connect + PING. Returns false (never throws) when Redis is
    // unreachable or refuses auth, invoking onUnavailable with the reason.
    // AbortOnConnectFail=true so a bad endpoint/password fails fast instead of
    // returning a multiplexer that reconnects forever in the background.
    public static bool CanConnect(ConfigurationOptions options, Action<string>? onUnavailable = null)
    {
        try
        {
            var probe = options.Clone();
            probe.AbortOnConnectFail = true;
            probe.ConnectRetry = 1;
            probe.ConnectTimeout = Math.Min(probe.ConnectTimeout, 1000);
            probe.SyncTimeout = Math.Min(probe.SyncTimeout, 1000);
            using var mux = ConnectionMultiplexer.Connect(probe);
            mux.GetDatabase().Ping();
            return true;
        }
        catch (Exception ex)
        {
            onUnavailable?.Invoke(ex.Message);
            return false;
        }
    }
}
