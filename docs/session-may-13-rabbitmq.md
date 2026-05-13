# Session — May 13, 2026: M3.8 RabbitMQ Consumer

## What We Did

Implemented the full RabbitMQ producer + consumer pipeline for order events. The producer existed on an unmerged branch (`feature/backend/rabbitmq`); this session brought it into `development` and added the consumer (`RabbitMqConsumerService`) as the M3.8 deliverable.

---

## What Is RabbitMQ?

RabbitMQ is an open-source **message broker** that implements the AMQP protocol. It lets services communicate **asynchronously** — one service puts a message on a queue and continues immediately; a separate consumer picks it up in its own time.

### Why use it instead of calling a service directly?

| Direct call | Message broker |
|---|---|
| Caller blocks waiting for a response | Caller publishes and moves on |
| If the receiver is down, the call fails | Messages are buffered; consumer processes them when it recovers |
| Tight coupling — caller must know the receiver | Decoupled — publisher knows nothing about who consumes |
| Hard to add a second consumer | Add a new binding; publisher never changes |

In DashTab, when a waiter places an order the API must return fast. Sending a confirmation email (slow) or broadcasting a real-time update (M3.6) should not block that response. RabbitMQ lets us fire those side effects asynchronously.

---

## Core Concepts

### Exchange
The entry point for published messages. Producers never write directly to a queue — they publish to an exchange and let the broker route the message. Exchange types:

| Type | Routing behaviour |
|---|---|
| **direct** | Routes to queues whose binding key exactly matches the routing key |
| **topic** | Routes using `*` (one word) and `#` (zero or more words) wildcards |
| **fanout** | Ignores the routing key; delivers to every bound queue |

DashTab uses a **topic exchange** (`dashtab.orders`) so future consumers can subscribe selectively (e.g., only `order.placed`).

### Queue
A durable buffer. Consumers subscribe to a queue. Multiple consumers on the same queue share load (competing consumers). Multiple queues bound to the same exchange receive independent copies (fan-out).

### Binding
A rule that tells the exchange which queue to route a message to, based on the routing key pattern.

### Routing key
A dot-separated string attached to each published message. In our case: `order.placed`, `order.status_changed`, `order.cancelled`.

### Durability
A durable exchange and queue survive a broker restart. Persistent messages (delivery mode 2) are written to disk before the broker acks the publish.

### Ack / Nack
By default the broker removes a message from the queue immediately on delivery (autoAck). With manual ack, the consumer signals success (`BasicAck`) only after it has fully processed the message. If the consumer crashes, the unacked message is re-delivered. On bad data, `BasicNack(requeue: false)` discards the message (prevents poison-message loops).

---

## Our Topology

```
OrderService (producer)
    │
    │  publish("order.placed")
    │  publish("order.status_changed")
    │  publish("order.cancelled")
    ▼
Exchange: dashtab.orders  (topic, durable)
    │
    │  binding: order.*
    ▼
Queue: dashtab.orders.audit  (durable)
    │
    ▼
RabbitMqConsumerService (consumer / hosted service)
    └── logs structured Serilog event → Loki via promtail
```

The `order.*` wildcard matches all three routing keys. When M3.6 (SignalR) is added, the consumer will also call `IHubContext<OrderHub>.Clients.All.SendAsync("orderUpdated", order)` in the same switch block — the broker topology stays unchanged.

---

## Producer Side

### Connection (`RabbitMqConnection.cs`)

A singleton that lazily opens one `IConnection` and reuses it. `AutomaticRecoveryEnabled` means the RabbitMQ client library transparently reconnects and re-declares channels if the broker drops the connection.

```csharp
// Lazy: won't throw at startup if RabbitMQ is briefly unavailable.
public async Task<IConnection> GetAsync(CancellationToken ct = default)
{
    if (_connection is { IsOpen: true }) return _connection;
    await _gate.WaitAsync(ct);              // serialise concurrent callers
    try
    {
        if (_connection is { IsOpen: true }) return _connection;
        if (_connection is not null)
            await _connection.DisposeAsync();
        _connection = await _factory.CreateConnectionAsync(ct);
        return _connection;
    }
    finally { _gate.Release(); }
}
```

Key settings on `ConnectionFactory`:
```csharp
_factory = new ConnectionFactory
{
    Uri                      = new Uri(rabbitMqUri),
    AutomaticRecoveryEnabled = true,   // reconnects on drop
    TopologyRecoveryEnabled  = true,   // re-declares exchanges/queues after reconnect
    ClientProvidedName       = "DashTab.API",
};
```

### Exchange declaration (`RabbitMqTopologyInitializer.cs`)

An `IHostedService` that runs once on startup and declares the exchange so both producer and consumer agree on its name and type. Wrapped in try/catch so the API still boots if the broker is temporarily down.

```csharp
await channel.ExchangeDeclareAsync(
    exchange:   "dashtab.orders",
    type:       ExchangeType.Topic,
    durable:    true,
    autoDelete: false);
```

### Publishing (`RabbitMqEventPublisher.cs`)

Serialises the event to JSON (camelCase) and publishes with `Persistent = true` (written to disk):

```csharp
public async Task PublishAsync<T>(T @event, string routingKey, CancellationToken ct = default)
    where T : class
{
    var conn = await connection.GetAsync(ct);
    _channel ??= await conn.CreateChannelAsync(cancellationToken: ct);

    var body = JsonSerializer.SerializeToUtf8Bytes(@event, JsonOptions);
    var props = new BasicProperties
    {
        Persistent    = true,
        ContentType   = "application/json",
        MessageId     = Guid.NewGuid().ToString(),
        CorrelationId = Activity.Current?.TraceId.ToString(),  // links to the HTTP trace
    };

    await _channel.BasicPublishAsync(
        exchange:   "dashtab.orders",
        routingKey: routingKey,
        body:       body,
        basicProperties: props);
}
```

Errors are caught and logged — the order is already persisted in Postgres, so a broker blip should never surface as an API error.

### OrderService integration

`OrderService` now holds both `IBackgroundJobClient` (Hangfire email) and `IEventPublisher` (RabbitMQ). The two fire side-by-side after `SaveChangesAsync`:

```csharp
await db.SaveChangesAsync();

var dto = mapper.ToDto(order, now);
backgroundJobs.Enqueue<OrderEmailJob>(j => j.SendOrderConfirmation(order.Id)); // email
await events.PublishAsync(new OrderPlacedEvent(dto, now), OrderRoutingKeys.Placed); // broker
return dto;
```

---

## Consumer Side (`RabbitMqConsumerService.cs`)

An `IHostedService` (singleton, runs for the lifetime of the API process).

### Startup — queue + binding

```csharp
await _channel.QueueDeclareAsync(
    queue:      "dashtab.orders.audit",
    durable:    true,
    exclusive:  false,
    autoDelete: false);

await _channel.QueueBindAsync(
    queue:      "dashtab.orders.audit",
    exchange:   "dashtab.orders",
    routingKey: "order.*");   // matches all three routing keys
```

### Consuming with AsyncEventingBasicConsumer

```csharp
var consumer = new AsyncEventingBasicConsumer(_channel);
consumer.ReceivedAsync += OnMessageAsync;

await _channel.BasicConsumeAsync(
    queue:   "dashtab.orders.audit",
    autoAck: false,   // manual ack — message stays on queue until we process it
    consumer: consumer);
```

### Routing-key dispatch + ack/nack

```csharp
private async Task OnMessageAsync(object sender, BasicDeliverEventArgs e)
{
    try
    {
        var body = Encoding.UTF8.GetString(e.Body.Span);

        switch (e.RoutingKey)
        {
            case OrderRoutingKeys.Placed:
                var placed = JsonSerializer.Deserialize<OrderPlacedEvent>(body, JsonOptions);
                logger.LogInformation(
                    "Order placed: OrderId={OrderId} Table={Table} Total={Total}",
                    placed!.Order.Id, placed.Order.TableNumber, placed.Order.TotalAmount);
                break;

            case OrderRoutingKeys.StatusChanged:
                var changed = JsonSerializer.Deserialize<OrderStatusChangedEvent>(body, JsonOptions);
                logger.LogInformation(
                    "Order status changed: OrderId={OrderId} {PreviousStatus} → {NewStatus}",
                    changed!.Order.Id, changed.PreviousStatus, changed.Order.Status);
                break;

            case OrderRoutingKeys.Cancelled:
                var cancelled = JsonSerializer.Deserialize<OrderCancelledEvent>(body, JsonOptions);
                logger.LogInformation(
                    "Order cancelled: OrderId={OrderId} was {PreviousStatus}",
                    cancelled!.Order.Id, cancelled.PreviousStatus);
                break;
        }

        await _channel!.BasicAckAsync(e.DeliveryTag, multiple: false);  // success
    }
    catch (JsonException ex)
    {
        logger.LogError(ex, "Malformed message — rejecting without requeue");
        await _channel!.BasicNackAsync(e.DeliveryTag, multiple: false, requeue: false);
    }
    catch (Exception ex)
    {
        logger.LogError(ex, "Transient failure — requeueing");
        await _channel!.BasicNackAsync(e.DeliveryTag, multiple: false, requeue: true);
    }
}
```

---

## DI Registration (`Program.cs`)

Registration is conditional: if `ConnectionStrings:RabbitMQ` is absent (e.g. local dev without Docker), a `NullEventPublisher` is registered instead so the API still starts cleanly.

```csharp
builder.Services.Configure<RabbitMqOptions>(
    builder.Configuration.GetSection(RabbitMqOptions.SectionName));

var rabbitMqUri = builder.Configuration.GetConnectionString("RabbitMQ");
if (!string.IsNullOrWhiteSpace(rabbitMqUri))
{
    builder.Services.AddSingleton<RabbitMqConnection>();
    builder.Services.AddScoped<IEventPublisher, RabbitMqEventPublisher>();
    builder.Services.AddHostedService<RabbitMqTopologyInitializer>();
    builder.Services.AddHostedService<RabbitMqConsumerService>();
}
else
{
    builder.Services.AddSingleton<IEventPublisher, NullEventPublisher>();
}
```

Connection string comes from Docker Compose (never in git):
```yaml
ConnectionStrings__RabbitMQ: "amqp://${RABBITMQ_USER}:${RABBITMQ_PASSWORD}@rabbitmq:5672"
```

---

## Verification

1. **Boot the stack:**
   ```bash
   cd devops/docker
   docker compose --profile backend up
   ```

2. **Check RabbitMQ management UI** at `http://localhost:15672`:
   - Exchanges → `dashtab.orders` (topic, durable) ✓
   - Queues → `dashtab.orders.audit` (durable) ✓
   - Queues → Bindings tab → `order.*` from `dashtab.orders` ✓

3. **Place an order** (replace token + IDs as needed):
   ```bash
   curl -s -X POST http://localhost:5000/api/v1/orders \
     -H "Authorization: Bearer <token>" \
     -H "Content-Type: application/json" \
     -d '{"tableNumber":"T1","items":[{"menuItemId":"<id>","quantity":1}]}'
   ```

4. **Observe paired log lines** in `docker compose logs backend`:
   ```
   Published OrderPlacedEvent to dashtab.orders/order.placed
   Order placed: OrderId=<uuid> OrderNumber=001 Table=T1 Total=12.50
   ```

5. **Change order status:**
   ```bash
   curl -s -X PATCH http://localhost:5000/api/v1/orders/<id>/status \
     -H "Authorization: Bearer <token>" \
     -H "Content-Type: application/json" \
     -d '"preparing"'
   ```
   Observe:
   ```
   Published OrderStatusChangedEvent to dashtab.orders/order.status_changed
   Order status changed: OrderId=<uuid> new → preparing
   ```

---

## What's Next (M3.6)

The consumer's `OnMessageAsync` switch block already has the right shape to add a SignalR broadcast:

```csharp
case OrderRoutingKeys.StatusChanged:
    var ev = JsonSerializer.Deserialize<OrderStatusChangedEvent>(body, JsonOptions);
    // existing log line stays
    await hubContext.Clients.All.SendAsync("orderUpdated", ev!.Order);  // M3.6 addition
    break;
```

No topology changes required — the exchange, queue and binding stay identical.
