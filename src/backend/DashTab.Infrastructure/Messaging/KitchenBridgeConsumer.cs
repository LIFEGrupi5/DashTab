using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;
using DashTab.Application.Events;
using DashTab.Application.Interfaces;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using RabbitMQ.Client;
using RabbitMQ.Client.Events;

namespace DashTab.Infrastructure.Messaging;

// Second consumer on the dashtab.orders exchange (the first is the audit logger).
// Forwards every order.* event to connected KDS clients via IKdsBroadcaster.
// Lives in a separate queue from the audit consumer so the two fan out
// independently — losing one does not back the other up.
public sealed class KitchenBridgeConsumer(
    RabbitMqConnection connection,
    IServiceScopeFactory scopeFactory,
    IOptions<RabbitMqOptions> options,
    ILogger<KitchenBridgeConsumer> logger) : IHostedService, IAsyncDisposable
{
    private const string QueueName = "dashtab.orders.kitchen";

    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
        Converters = { new JsonStringEnumConverter(JsonNamingPolicy.CamelCase) },
    };

    private readonly RabbitMqOptions _options = options.Value;
    private IChannel? _channel;

    public async Task StartAsync(CancellationToken ct)
    {
        try
        {
            var conn = await connection.GetAsync(ct);
            _channel = await conn.CreateChannelAsync(cancellationToken: ct);

            await _channel.QueueDeclareAsync(
                queue:      QueueName,
                durable:    true,
                exclusive:  false,
                autoDelete: false,
                cancellationToken: ct);

            await _channel.QueueBindAsync(
                queue:      QueueName,
                exchange:   _options.Exchange,
                routingKey: "order.*",
                cancellationToken: ct);

            var consumer = new AsyncEventingBasicConsumer(_channel);
            consumer.ReceivedAsync += OnMessageAsync;

            await _channel.BasicConsumeAsync(
                queue:     QueueName,
                autoAck:   false,
                consumer:  consumer,
                cancellationToken: ct);

            logger.LogInformation(
                "Kitchen SignalR bridge started on queue '{Queue}' (exchange '{Exchange}', binding 'order.*')",
                QueueName, _options.Exchange);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Failed to start kitchen SignalR bridge on queue '{Queue}'", QueueName);
        }
    }

    private async Task OnMessageAsync(object sender, BasicDeliverEventArgs e)
    {
        var routingKey = e.RoutingKey;
        try
        {
            var body = Encoding.UTF8.GetString(e.Body.Span);
            // IKdsBroadcaster is singleton, but resolve through a scope so any future
            // scoped dependency it grows works without surprise.
            using var scope = scopeFactory.CreateScope();
            var broadcaster = scope.ServiceProvider.GetRequiredService<IKdsBroadcaster>();

            switch (routingKey)
            {
                case OrderRoutingKeys.Placed:
                {
                    var ev = JsonSerializer.Deserialize<OrderPlacedEvent>(body, JsonOptions);
                    if (ev is not null)
                        await broadcaster.OrderPlacedAsync(ev.Order);
                    break;
                }
                case OrderRoutingKeys.StatusChanged:
                {
                    var ev = JsonSerializer.Deserialize<OrderStatusChangedEvent>(body, JsonOptions);
                    if (ev is not null)
                        await broadcaster.OrderStatusChangedAsync(ev.Order, ev.PreviousStatus);
                    break;
                }
                case OrderRoutingKeys.Cancelled:
                {
                    var ev = JsonSerializer.Deserialize<OrderCancelledEvent>(body, JsonOptions);
                    if (ev is not null)
                        await broadcaster.OrderCancelledAsync(ev.Order, ev.PreviousStatus);
                    break;
                }
                default:
                    logger.LogWarning("Kitchen bridge: unknown routing key '{RoutingKey}' — ignoring", routingKey);
                    break;
            }

            await _channel!.BasicAckAsync(e.DeliveryTag, multiple: false);
        }
        catch (JsonException ex)
        {
            logger.LogError(ex,
                "Kitchen bridge: failed to deserialize message with routing key '{RoutingKey}' — rejecting without requeue",
                routingKey);
            await _channel!.BasicNackAsync(e.DeliveryTag, multiple: false, requeue: false);
        }
        catch (Exception ex)
        {
            logger.LogError(ex,
                "Kitchen bridge: unexpected error broadcasting message with routing key '{RoutingKey}' — requeueing",
                routingKey);
            await _channel!.BasicNackAsync(e.DeliveryTag, multiple: false, requeue: true);
        }
    }

    public Task StopAsync(CancellationToken ct) => Task.CompletedTask;

    public async ValueTask DisposeAsync()
    {
        if (_channel is not null)
            await _channel.DisposeAsync();
    }
}
