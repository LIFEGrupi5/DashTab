using DashTab.Infrastructure.Caching;
using StackExchange.Redis;

namespace DashTab.UnitTests.Services;

public class RedisConnectivityTests
{
    [Fact]
    public void CanConnect_returns_false_and_reports_when_redis_is_unreachable()
    {
        // A port nothing listens on: the probe must fail fast and return false WITHOUT
        // throwing. That graceful "no" is exactly what keeps a dead/misconfigured Redis
        // from aborting SignalR hub connections with WebSocket close 1011.
        var options = ConfigurationOptions.Parse("127.0.0.1:6399");
        string? reason = null;

        var ok = RedisConnectivity.CanConnect(options, r => reason = r);

        Assert.False(ok);
        Assert.NotNull(reason);
    }
}
