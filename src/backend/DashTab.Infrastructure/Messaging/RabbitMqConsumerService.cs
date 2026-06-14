using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;
using DashTab.Application.Events;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using RabbitMQ.Client;
using RabbitMQ.Client.Events;

namespace DashTab.Infrastructure.Messaging;

public sealed class RabbitMqConsumerService(
    RabbitMqConnection connection,
    IOptions<RabbitMqOptions> options,
    ILogger<RabbitMqConsumerService> logger) : IHostedService, IAsyncDisposable
{
    private const string QueueName = "dashtab.orders.audit";

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

            // Declare the durable queue and bind it to every order.* event.
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
                "RabbitMQ consumer started on queue '{Queue}' (exchange '{Exchange}', binding 'order.*')",
                QueueName, _options.Exchange);
        }
        catch (Exception ex)
        {
            // Don't crash the API if the broker is briefly unavailable on startup.
            logger.LogError(ex, "Failed to start RabbitMQ consumer on queue '{Queue}'", QueueName);
        }
    }

    private async Task OnMessageAsync(object sender, BasicDeliverEventArgs e)
    {
        var routingKey = e.RoutingKey;
        try
        {
            var body = Encoding.UTF8.GetString(e.Body.Span);

            switch (routingKey)
            {
                case OrderRoutingKeys.Placed:
                {
                    var ev = JsonSerializer.Deserialize<OrderPlacedEvent>(body, JsonOptions);
                    if (ev is not null)
                        logger.LogInformation(
                            "Order placed: OrderId={OrderId} OrderNumber={OrderNumber} Table={Table} Total={Total}",
                            ev.Order.Id, ev.Order.OrderNumber, ev.Order.TableNumber, ev.Order.TotalAmount);
                    break;
                }
                case OrderRoutingKeys.StatusChanged:
                {
                    var ev = JsonSerializer.Deserialize<OrderStatusChangedEvent>(body, JsonOptions);
                    if (ev is not null)
                        logger.LogInformation(
                            "Order status changed: OrderId={OrderId} {PreviousStatus} → {NewStatus}",
                            ev.Order.Id, ev.PreviousStatus, ev.Order.Status);
                    break;
                }
                case OrderRoutingKeys.Cancelled:
                {
                    var ev = JsonSerializer.Deserialize<OrderCancelledEvent>(body, JsonOptions);
                    if (ev is not null)
                        logger.LogInformation(
                            "Order cancelled: OrderId={OrderId} was {PreviousStatus}",
                            ev.Order.Id, ev.PreviousStatus);
                    break;
                }
                default:
                    logger.LogWarning("Received unknown routing key '{RoutingKey}' — ignoring", routingKey);
                    break;
            }

            await _channel!.BasicAckAsync(e.DeliveryTag, multiple: false);
        }
        catch (JsonException ex)
        {
            // Malformed payload — reject without requeue to avoid poison-message loops.
            logger.LogError(ex,
                "Failed to deserialize message with routing key '{RoutingKey}' — rejecting without requeue",
                routingKey);
            await _channel!.BasicNackAsync(e.DeliveryTag, multiple: false, requeue: false);
        }
        catch (Exception ex)
        {
            // Transient failure — requeue so the broker retries.
            logger.LogError(ex,
                "Unexpected error processing message with routing key '{RoutingKey}' — requeueing",
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
