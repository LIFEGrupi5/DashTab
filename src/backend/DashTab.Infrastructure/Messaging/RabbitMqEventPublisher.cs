using System.Diagnostics;
using System.Text.Json;
using System.Text.Json.Serialization;
using DashTab.Application.Interfaces;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using RabbitMQ.Client;

namespace DashTab.Infrastructure.Messaging;

public sealed class RabbitMqEventPublisher(
    RabbitMqConnection connection,
    IOptions<RabbitMqOptions> options,
    ILogger<RabbitMqEventPublisher> logger) : IEventPublisher, IAsyncDisposable
{
    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
        Converters = { new JsonStringEnumConverter(JsonNamingPolicy.CamelCase) },
    };

    private readonly RabbitMqOptions _options = options.Value;
    private IChannel? _channel;

    public async Task PublishAsync<T>(T @event, string routingKey, CancellationToken ct = default) where T : class
    {
        try
        {
            var conn = await connection.GetAsync(ct);
            _channel ??= await conn.CreateChannelAsync(cancellationToken: ct);

            var body = JsonSerializer.SerializeToUtf8Bytes(@event, JsonOptions);
            var props = new BasicProperties
            {
                Persistent = true,
                ContentType = "application/json",
                MessageId = Guid.NewGuid().ToString(),
                Timestamp = new AmqpTimestamp(DateTimeOffset.UtcNow.ToUnixTimeSeconds()),
                CorrelationId = Activity.Current?.TraceId.ToString() ?? Guid.NewGuid().ToString(),
                Headers = new Dictionary<string, object?>
                {
                    ["event-type"] = typeof(T).Name,
                },
            };

            await _channel.BasicPublishAsync(
                exchange: _options.Exchange,
                routingKey: routingKey,
                mandatory: false,
                basicProperties: props,
                body: body,
                cancellationToken: ct);

            logger.LogDebug("Published {EventType} to {Exchange}/{RoutingKey}",
                typeof(T).Name, _options.Exchange, routingKey);
        }
        catch (Exception ex)
        {
            // Fire-and-forget: the order is already persisted. Log and move on.
            logger.LogError(ex, "Failed to publish {EventType} to {Exchange}/{RoutingKey}",
                typeof(T).Name, _options.Exchange, routingKey);
        }
    }

    public async ValueTask DisposeAsync()
    {
        if (_channel is not null)
            await _channel.DisposeAsync();
    }
}
