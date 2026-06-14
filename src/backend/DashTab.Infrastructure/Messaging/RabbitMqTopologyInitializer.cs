using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using RabbitMQ.Client;

namespace DashTab.Infrastructure.Messaging;

public sealed class RabbitMqTopologyInitializer(
    RabbitMqConnection connection,
    IOptions<RabbitMqOptions> options,
    ILogger<RabbitMqTopologyInitializer> logger) : IHostedService
{
    private readonly RabbitMqOptions _options = options.Value;

    public async Task StartAsync(CancellationToken cancellationToken)
    {
        try
        {
            var conn = await connection.GetAsync(cancellationToken);
            await using var channel = await conn.CreateChannelAsync(cancellationToken: cancellationToken);
            await channel.ExchangeDeclareAsync(
                exchange:   _options.Exchange,
                type:       ExchangeType.Topic,
                durable:    true,
                autoDelete: false,
                cancellationToken: cancellationToken);

            logger.LogInformation("Declared RabbitMQ topic exchange '{Exchange}'", _options.Exchange);
        }
        catch (Exception ex)
        {
            // Don't crash the API if the broker is briefly unavailable on startup.
            logger.LogError(ex, "Failed to declare RabbitMQ exchange '{Exchange}' on startup", _options.Exchange);
        }
    }

    public Task StopAsync(CancellationToken cancellationToken) => Task.CompletedTask;
}
