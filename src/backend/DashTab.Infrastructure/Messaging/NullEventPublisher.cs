using DashTab.Application.Interfaces;

namespace DashTab.Infrastructure.Messaging;

// Used when ConnectionStrings:RabbitMQ is absent (e.g. local dev without Docker).
public sealed class NullEventPublisher : IEventPublisher
{
    public Task PublishAsync<T>(T @event, string routingKey, CancellationToken ct = default) where T : class
        => Task.CompletedTask;
}
