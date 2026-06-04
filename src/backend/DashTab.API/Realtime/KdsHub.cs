using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;

namespace DashTab.API.Realtime;

[Authorize(Roles = "Owner,Manager,Kitchen")]
public sealed class KdsHub : Hub
{
    public const string KitchenGroupPrefix = "kitchen";

    public static string KitchenGroup(Guid restaurantId) => $"{KitchenGroupPrefix}:{restaurantId}";

    public override async Task OnConnectedAsync()
    {
        var restaurantId = Context.GetHttpContext()?.Items["RestaurantId"];
        if (restaurantId is Guid rid)
            await Groups.AddToGroupAsync(Context.ConnectionId, KitchenGroup(rid));

        await base.OnConnectedAsync();
    }
}
