using System.ComponentModel;
using DashTab.Application.Dtos;
using DashTab.Application.Interfaces;
using ModelContextProtocol.Server;

namespace DashTab.API.Mcp;

// Read-only MCP tools over the orders/KDS domain. Lets an AI agent inspect the
// current order book through the same tenant-scoped service the REST API uses.
[McpServerToolType]
public static class OrderTools
{
    [McpServerTool(Name = "list_orders")]
    [Description("List orders for the current restaurant. Optionally filter by status (New, Preparing, Ready, Completed, Cancelled).")]
    public static async Task<IEnumerable<OrderDto>> ListOrders(
        IOrderService orders,
        [Description("Filter by order status: New, Preparing, Ready, Completed, or Cancelled. Omit for all statuses.")]
        string? status = null,
        [Description("Max number of orders to return (1-200). Defaults to 50.")]
        int take = 50)
    {
        take = Math.Clamp(take, 1, 200);
        var result = await orders.ListAsync(status, skip: 0, take: take);
        return result.Items;
    }

    [McpServerTool(Name = "get_order")]
    [Description("Get a single order by its id, including its line items.")]
    public static Task<OrderDto?> GetOrder(
        IOrderService orders,
        [Description("Order id (GUID).")] Guid id) =>
        orders.GetByIdAsync(id);

    [McpServerTool(Name = "list_kitchen_queue")]
    [Description("List the active kitchen queue — orders that are New or Preparing, in the sequence the kitchen should work them.")]
    public static async Task<IEnumerable<OrderDto>> ListKitchenQueue(
        IOrderService orders,
        [Description("Max number of orders to return (1-200). Defaults to 50.")]
        int take = 50)
    {
        take = Math.Clamp(take, 1, 200);
        // Pull New + Preparing separately (the service filters by a single status)
        // and merge, oldest-first so the kitchen works them in order.
        var newOrders = (await orders.ListAsync("New", skip: 0, take: take)).Items;
        var preparing = (await orders.ListAsync("Preparing", skip: 0, take: take)).Items;
        return newOrders
            .Concat(preparing)
            .OrderBy(o => o.PlacedAtIso)
            .Take(take);
    }
}
