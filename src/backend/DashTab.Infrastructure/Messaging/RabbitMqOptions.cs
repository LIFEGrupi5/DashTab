namespace DashTab.Infrastructure.Messaging;

public sealed class RabbitMqOptions
{
    public const string SectionName = "RabbitMq";

    public string Exchange { get; set; } = "dashtab.orders";
}
