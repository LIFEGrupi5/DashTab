using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;

namespace DashTab.API.Realtime;

[Authorize(Roles = "Owner,Manager,Kitchen")]
public sealed class KdsHub(ILogger<KdsHub> logger) : Hub
{
    public const string KitchenGroupPrefix = "kitchen";

    public static string KitchenGroup(Guid restaurantId) => $"{KitchenGroupPrefix}:{restaurantId}";

    public override async Task OnConnectedAsync()
    {
        // Joining the group writes to the Redis SignalR backplane. A transient
        // backplane hiccup must NOT bubble out of OnConnectedAsync: an unhandled
        // exception here aborts the socket with WS close 1011, and the client's
        // withAutomaticReconnect() then loops (connect → 1011 → reconnect → …).
        // Degrade gracefully instead — the client stays connected; it just won't
        // receive broadcasts until a (re)connect succeeds in joining the group.
        try
        {
            if (Context.GetHttpContext()?.Items["RestaurantId"] is Guid rid)
                await Groups.AddToGroupAsync(Context.ConnectionId, KitchenGroup(rid));
        }
        catch (Exception ex)
        {
            logger.LogWarning(ex,
                "KDS: failed to add connection {ConnectionId} to its kitchen group", Context.ConnectionId);
        }

        await base.OnConnectedAsync();
    }
}
