# RabbitMQ — DashTab Order Events

This doc covers what we publish, why we chose this topology, and how to ramp up if you've never used RabbitMQ before.

---

## TL;DR

The backend publishes three event types to a single RabbitMQ topic exchange whenever an order changes state. Consumers (kitchen worker, audit logger, notification service, …) bind their own queues and pick what they care about.

```
OrderService.CreateAsync       → exchange "dashtab.orders" / routing key "order.placed"
OrderService.UpdateStatusAsync → exchange "dashtab.orders" / routing key "order.status_changed"
OrderService.CancelAsync       → exchange "dashtab.orders" / routing key "order.cancelled"
```

No consumer ships in this phase — only the producer side. Phase 3B closes here; consumers land in later phases (kitchen worker, audit log, notifications).

---

## Concepts in 3 minutes

If you've worked with Kafka, the model is similar but the vocabulary is different:

| RabbitMQ term  | What it is                                                                 |
|----------------|----------------------------------------------------------------------------|
| **Connection** | A long-lived TCP connection to the broker. Expensive to open. One per app. |
| **Channel**    | A multiplexed virtual session over a connection. Cheap. **Not thread-safe.** Open one per concurrent operation. |
| **Exchange**   | The "router" — producers publish here. Has a type (topic / direct / fanout / headers). |
| **Queue**      | Where messages wait until a consumer reads them. Durable queues survive broker restart. |
| **Binding**    | Rule connecting a queue to an exchange, often with a routing-key pattern.  |
| **Routing key**| String the producer attaches; the exchange uses it to decide which queues get the message. |

Producers publish **to an exchange**, never directly to a queue. The queue is owned by the consumer.

---

## Our topology

- **Exchange:** `dashtab.orders`
  - Type: **topic** (routing keys are dot-separated patterns; consumers can wildcard)
  - Durable: yes (survives broker restart)
  - Auto-delete: no
- **Routing keys:** `order.placed`, `order.status_changed`, `order.cancelled`
- **Message payload:** JSON-serialised `OrderDto` snapshot (camelCase) wrapped in an event record (`OrderPlacedEvent`, `OrderStatusChangedEvent`, `OrderCancelledEvent`). See [Application/Events/OrderEvents.cs](../src/backend/DashTab.Application/Events/OrderEvents.cs).
- **Properties:**
  - `persistent = true` (delivery mode 2 — survives broker restart **if** the queue is also durable)
  - `content-type = application/json`
  - `correlation-id = <Activity.TraceId>` (lets logs in Loki tie back to the originating request)
  - `headers["event-type"] = "OrderPlacedEvent"` (etc.) — convenience for consumers that want to discriminate without parsing the body

### Why a topic exchange (and not fanout / direct)?

- **Fanout** copies every message to every bound queue — fine if every consumer wants everything, but a notification service that only cares about cancellations would still receive all placements.
- **Direct** matches the routing key exactly — works, but it lacks wildcards (`order.*`, `order.#`), so a kitchen consumer that wants every order event would need three bindings.
- **Topic** is the flexible default. A consumer can bind once with `order.*` and get the full firehose, or bind to `order.cancelled` only.

### Why one exchange, not three?

Topology stays small (one exchange to declare, one to monitor in the management UI), and the routing-key pattern still lets consumers select. Splitting per-event-type would add operational surface without buying anything until consumers actually conflict.

---

## Producer-side architecture

Three components in `src/backend/DashTab.Infrastructure/Messaging/`:

### 1. `RabbitMqConnection` — singleton

Holds the `IConnection`. Lazy-initialised on first publish so the API still boots when the broker is briefly down. `AutomaticRecoveryEnabled` + `TopologyRecoveryEnabled` mean the client reconnects on its own after a transient broker outage.

> **Why singleton?** AMQP connections are expensive (TLS handshake + auth). The standard pattern is one connection per app, many cheap channels off it.

### 2. `RabbitMqEventPublisher : IEventPublisher` — scoped

Owns a single `IChannel` for the lifetime of the request scope. Each publish:

1. Serialise the event record to JSON (camelCase, lowercase enum strings — same options as our HTTP layer).
2. Build `BasicProperties` with persistence, message ID, timestamp, correlation ID, and the `event-type` header.
3. `BasicPublishAsync(exchange, routingKey, mandatory:false, props, body)`.
4. **Catch all** exceptions, log them, swallow. The order is already saved — losing the event is logged but does not fail the user's request.

> **Why scoped?** Channels are not thread-safe. Scoped means one channel per request, which is naturally serialised. Singleton would force locking.

### 3. `RabbitMqTopologyInitializer : IHostedService`

Runs once on app startup. Opens a temporary channel, calls `ExchangeDeclareAsync` (idempotent — safe to run on every boot), logs success, disposes the channel. If the broker is unreachable the failure is logged but does not crash the API.

DI wiring lives in [src/backend/DashTab.API/Program.cs](../src/backend/DashTab.API/Program.cs) under the `// ── Messaging (RabbitMQ)` block.

---

## Configuration

| Source                                             | Key                            | Where set                                |
|----------------------------------------------------|--------------------------------|------------------------------------------|
| `appsettings.json`                                 | `RabbitMq:Exchange`            | Defaults to `dashtab.orders`             |
| Env / connection string                            | `ConnectionStrings:RabbitMQ`   | Set by `docker-compose.yml` for the backend container; for local-host runs use `dotnet user-secrets` |

Local (non-Docker) setup:

```bash
cd src/backend/DashTab.API
dotnet user-secrets set "ConnectionStrings:RabbitMQ" "amqp://dashtab:rabbit_dev@localhost:5672"
```

(Credentials match `RABBITMQ_USER` / `RABBITMQ_PASSWORD` in `devops/docker/.env`.)

---

## Smoke test

1. Bring the stack up:
   ```bash
   cd devops/docker && docker compose --profile backend up
   ```
2. Open the management UI: <http://localhost:15672> (login `dashtab` / `rabbit_dev`).
3. **Exchanges** tab — confirm `dashtab.orders` (type `topic`, `D` for durable) appears once the API has booted.
4. **Queues** tab → **Add a new queue** → name it `smoke-test`, durable.
5. Click into `dashtab.orders` → **Bindings** → bind queue `smoke-test` with routing key `order.*`.
6. Hit the API:
   ```bash
   curl -X POST http://localhost:5000/api/v1/orders \
     -H "Authorization: Bearer <token>" \
     -H "Content-Type: application/json" \
     -d '{"tableNumber":"T-12","items":[{"menuItemId":"<guid>","quantity":1}]}'
   ```
7. Back in the queue page, click **Get messages** → you should see the `OrderPlacedEvent` JSON with the full `OrderDto` payload.

Delete the queue when you're done — unbound test queues will accumulate messages forever.

---

## Adding a consumer (later phase)

When a service needs to react to order events (kitchen display worker, audit log, etc.), the pattern is:

```csharp
// In a BackgroundService, on StartAsync:
var conn = await _rabbitConnection.GetAsync(ct);
var channel = await conn.CreateChannelAsync(cancellationToken: ct);

await channel.QueueDeclareAsync(
    queue: "kitchen-worker",     // owned by this service
    durable: true,
    exclusive: false,
    autoDelete: false,
    cancellationToken: ct);

await channel.QueueBindAsync(
    queue: "kitchen-worker",
    exchange: "dashtab.orders",
    routingKey: "order.*",       // every order event
    cancellationToken: ct);

var consumer = new AsyncEventingBasicConsumer(channel);
consumer.ReceivedAsync += async (_, ea) =>
{
    var evt = JsonSerializer.Deserialize<OrderPlacedEvent>(ea.Body.Span);
    // ...handle...
    await channel.BasicAckAsync(ea.DeliveryTag, multiple: false);
};

await channel.BasicConsumeAsync(queue: "kitchen-worker", autoAck: false, consumer: consumer);
```

Key points for any consumer we add:

- **Own your queue.** Each service binds its own durable queue. Don't share queues — it splits the message stream across services.
- **Manual ack.** `autoAck: false` + explicit `BasicAckAsync` after successful processing. Prevents lost work if the consumer crashes mid-handler.
- **Idempotency.** RabbitMQ guarantees at-least-once delivery, not exactly-once. Use the `MessageId` header (a Guid we set per publish) to dedupe if the handler isn't naturally idempotent.
- **DLX (dead-letter exchange).** When a message keeps failing, it should be parked, not requeued forever. Configure `x-dead-letter-exchange` on the queue. We'll add this with the first real consumer.

---

## Trade-offs we accepted

### Fire-and-forget instead of outbox

The publish happens **after** `SaveChangesAsync` returns successfully. If the broker is down or the publish call throws between save and ack, the order is persisted but the event is lost. We log the failure but do not fail the user's request.

This is the right call for the current phase — we don't yet have any consumer that would notice a missing event in production. When we do (e.g. an audit log that auditors rely on, or a billing pipeline), upgrade to a **transactional outbox**:

1. In the same DB transaction as the order, insert a row into `outbox_messages` (event JSON + routing key + status).
2. A background worker polls the outbox, publishes each pending row to RabbitMQ, marks rows `published`.
3. Retries and dead-letter handling live in the worker, not in the request path.

That gives at-least-once delivery with no event loss on broker outage, at the cost of a table + a worker.

### Fat payloads (full `OrderDto`) instead of thin (id only)

We embed the full order + items snapshot in the event body. Consumers can act without a callback to the API. Trade-off: bigger messages, and consumers see a frozen-in-time snapshot — they cannot rely on it being current. For the use cases we have (kitchen display, audit, notifications) the snapshot is exactly what they want.

---

## Future work

- [ ] Real consumer (kitchen worker subscribing to `order.*`)
- [ ] Transactional outbox once a consumer exists where loss matters
- [ ] DLX + retry policy on each consumer's queue
- [ ] Schema versioning — add `v1` segment to routing keys (`order.placed.v1`) before the first cross-service consumer ships, so we can evolve without coordinated deploys
- [ ] Health check on `RabbitMqConnection` exposed on the API health endpoint

---

## Reference

- Producer code: [`src/backend/DashTab.Infrastructure/Messaging/`](../src/backend/DashTab.Infrastructure/Messaging/)
- Event records: [`src/backend/DashTab.Application/Events/OrderEvents.cs`](../src/backend/DashTab.Application/Events/OrderEvents.cs)
- Publisher abstraction: [`src/backend/DashTab.Application/Interfaces/IEventPublisher.cs`](../src/backend/DashTab.Application/Interfaces/IEventPublisher.cs)
- Wiring: [`src/backend/DashTab.API/Program.cs`](../src/backend/DashTab.API/Program.cs) (search for `RabbitMq`)
- Broker container: [`devops/docker/docker-compose.yml`](../devops/docker/docker-compose.yml) (`rabbitmq` service)
- RabbitMQ .NET client v7 docs: <https://www.rabbitmq.com/client-libraries/dotnet-api-guide>
