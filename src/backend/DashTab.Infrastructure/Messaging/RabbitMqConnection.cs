using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using RabbitMQ.Client;

namespace DashTab.Infrastructure.Messaging;

// Singleton wrapper around IConnection. Lazy-initialised so the API can boot
// when the broker is briefly unavailable; automatic recovery handles reconnects.
public sealed class RabbitMqConnection : IAsyncDisposable
{
    private readonly ConnectionFactory _factory;
    private readonly ILogger<RabbitMqConnection> _logger;
    private readonly SemaphoreSlim _gate = new(1, 1);
    private IConnection? _connection;

    public RabbitMqConnection(IConfiguration config, ILogger<RabbitMqConnection> logger)
    {
        _logger = logger;
        var uri = config.GetConnectionString("RabbitMQ")
                  ?? throw new InvalidOperationException("ConnectionStrings:RabbitMQ is not configured.");

        _factory = new ConnectionFactory
        {
            Uri = new Uri(uri),
            AutomaticRecoveryEnabled = true,
            TopologyRecoveryEnabled  = true,
            ClientProvidedName       = "DashTab.API",
        };
    }

    public async Task<IConnection> GetAsync(CancellationToken ct = default)
    {
        if (_connection is { IsOpen: true }) return _connection;

        await _gate.WaitAsync(ct);
        try
        {
            if (_connection is { IsOpen: true }) return _connection;

            if (_connection is not null)
                await _connection.DisposeAsync();

            _connection = await _factory.CreateConnectionAsync(ct);
            _logger.LogInformation("RabbitMQ connection established to {Endpoint}", _factory.Uri.Authority);
            return _connection;
        }
        finally
        {
            _gate.Release();
        }
    }

    public async ValueTask DisposeAsync()
    {
        if (_connection is not null)
            await _connection.DisposeAsync();
        _gate.Dispose();
    }
}
