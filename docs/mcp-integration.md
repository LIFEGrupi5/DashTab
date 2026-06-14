# MCP Server Integration — Phase 1 (read-only KDS/orders)

This doc walks through adding a Model Context Protocol (MCP) server to `DashTab.API` so AI agents (Claude Code, Claude Desktop, etc.) can read order/kitchen state through the same backend the SPA uses.

## Scope

- **Read-only**. Tools query, never mutate.
- **One domain**: orders/KDS, built on the existing `IOrderService`.
- **Hosted inside `DashTab.API`** over Streamable HTTP at `/mcp`. Reuses Keycloak JWT auth, CORS, Serilog, deployment — no second process.
- Roles allowed: `Owner`, `Manager`, `Kitchen` (same gate as `KdsHub`).

## What you're building (mental model)

```
AI agent ──HTTP+JWT──> /mcp ──> OrderTools ──> IOrderService ──> DashTabDbContext
                              (MCP server)    (already exists)   (already exists)
```

MCP tools are just C# methods decorated with attributes. The SDK turns method signatures into the tool's JSON schema and routes invocations to them.

---

## Step 0 — Add the NuGet package

Run from the API project:

```bash
cd src/backend/DashTab.API
dotnet add package ModelContextProtocol.AspNetCore --prerelease
```

That pulls in both the core `ModelContextProtocol` SDK and the ASP.NET Core hosting helpers.

---

## File 1 — `src/backend/DashTab.API/DashTab.API.csproj` (EDIT)

After running the command above, your `<ItemGroup>` will have a new line. It should look like this (version may differ — keep whatever `dotnet add` wrote):

```xml
<PackageReference Include="ModelContextProtocol.AspNetCore" Version="0.3.0-preview.4" />
```

No other csproj changes needed.

---

## File 2 — `src/backend/DashTab.API/Mcp/OrderTools.cs` (NEW)

Create the folder `src/backend/DashTab.API/Mcp/` and add this file.

```csharp
using System.ComponentModel;
using DashTab.Application.Dtos;
using DashTab.Application.Interfaces;
using DashTab.Domain.Enums;
using ModelContextProtocol.Server;

namespace DashTab.API.Mcp;

[McpServerToolType]
public static class OrderTools
{
    [McpServerTool(Name = "list_orders")]
    [Description("List orders, optionally filtered by status. Returns most recent first.")]
    public static async Task<IEnumerable<OrderDto>> ListOrders(
        IOrderService orders,
        [Description("Filter by status: New, Preparing, Ready, Completed, Cancelled. Omit for all.")]
        OrderStatus? status = null,
        [Description("Max number of orders to return (1-100). Defaults to 25.")]
        int take = 25)
    {
        take = Math.Clamp(take, 1, 100);
        var result = await orders.ListAsync(status?.ToString());
        return result.Take(take);
    }

    [McpServerTool(Name = "get_order")]
    [Description("Get a single order by its id.")]
    public static Task<OrderDto?> GetOrder(
        IOrderService orders,
        [Description("Order id (GUID).")] Guid id) =>
        orders.GetByIdAsync(id);

    [McpServerTool(Name = "list_kitchen_queue")]
    [Description("Orders currently in the kitchen (status = New or Preparing), oldest first.")]
    public static async Task<IEnumerable<OrderDto>> ListKitchenQueue(IOrderService orders)
    {
        var all = await orders.ListAsync();
        return all
            .Where(o => o.Status is "New" or "Preparing")
            .OrderBy(o => o.PlacedAtIso);
    }
}
```

### Things to notice (this is the learning bit)

- `[McpServerToolType]` on the class and `[McpServerTool]` on each method are how the SDK discovers tools.
- **Method parameters become the tool's input schema.** `OrderStatus? status = null` shows up to the agent as an optional enum.
- **`[Description]` is what the agent reads** to decide which tool to call. Write these like you're explaining to a teammate.
- **DI just works.** `IOrderService orders` is injected per call — same container as controllers.
- No new application/infrastructure code needed for phase 1 — the existing `IOrderService` already has the reads we need.

---

## File 3 — `src/backend/DashTab.API/Program.cs` (EDIT)

Three small changes. Find the matching sections and add the new lines.

### 3a. Add the `using` near the top

```csharp
using Microsoft.AspNetCore.Authorization;
```

(All the other usings you need are already imported via the SDK's attributes inside `OrderTools.cs`.)

### 3b. Register the MCP server — put this next to the other service registrations

A good spot is right after the SignalR block (around line 259, just after `AddSingleton<IKdsBroadcaster, KdsBroadcaster>()`):

```csharp
// ── MCP server (read-only tools for AI agents) ───────────────────────────────
builder.Services.AddMcpServer()
    .WithHttpTransport()
    .WithToolsFromAssembly();
```

`WithToolsFromAssembly()` scans the current assembly for `[McpServerToolType]` classes — that's how `OrderTools` gets picked up.

### 3c. Map the endpoint — put this right after `app.MapHub<KdsHub>("/hubs/kds");`

```csharp
app.MapMcp("/mcp")
    .RequireAuthorization(new AuthorizeAttribute { Roles = "Owner,Manager,Kitchen" });
```

That's it for `Program.cs`. The JWT bearer pipeline already in place handles tokens for `/mcp` exactly like for `/api/*` controllers — no querystring carveout needed (only SignalR needs that, because WebSocket upgrades can't carry headers).

---

## File 4 — `src/backend/CLAUDE.md` (EDIT, optional but recommended)

Add a short section at the bottom so future Claude sessions (and humans) know it's there:

```markdown
## MCP server

`DashTab.API` exposes an MCP server at `/mcp` (Streamable HTTP). Tools live in
`DashTab.API/Mcp/` and are auto-discovered via `[McpServerToolType]`. Auth is
the same Keycloak JWT used by REST + SignalR, role-gated to
`Owner,Manager,Kitchen`. See `docs/mcp-integration.md` for the build-out and
how to connect a client.
```

---

## Testing it locally

1. Start the API (Docker or `dotnet run` per the backend README).
2. Get a dev access token from Keycloak for a user with the `Kitchen` role (same way you log into the SPA).
3. Register the server with Claude Code:

   ```bash
   claude mcp add dashtab-kds --transport http http://localhost:5000/mcp \
     --header "Authorization: Bearer <your-token>"
   ```

4. In a Claude Code session, run `/mcp` to confirm `dashtab-kds` is connected and the three tools (`list_orders`, `get_order`, `list_kitchen_queue`) are listed.
5. Ask: *"What's in the kitchen queue?"* — the agent should call `list_kitchen_queue`.

---

## Common gotchas

- **401 from `/mcp`** → token expired or missing the required role. Same fix as a 401 from any other endpoint.
- **Tool not appearing** → forgot `[McpServerToolType]` on the class, or the file isn't in `DashTab.API` (the assembly that `WithToolsFromAssembly()` scans).
- **Agent picks the wrong tool** → the `[Description]` is too vague. Be specific about *when* to use it and what it returns.
- **CORS errors from a browser-based client** → only relevant if you wire MCP into the SPA later. Phase 1 clients (Claude Code, Desktop) are not browsers and don't hit CORS.

---

## Phase 2 (later, not now)

- Mutating tools (`update_order_status`, `cancel_order`) — extra care on auth + idempotency.
- Other domains: menu, inventory, staff, analytics.
- MCP *resources* (e.g. `kds://queue` snapshot) and *prompts* for canned workflows.
- Per-tool rate limits once we know real agent usage.
