using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;

namespace DashTab.API.Realtime;

[Authorize(Roles = "Owner,Manager,Kitchen")]
public sealed class KdsHub : Hub
{
    public const string KitchenGroup = "kitchen";

    public override async Task OnConnectedAsync()
    {
        await Groups.AddToGroupAsync(Context.ConnectionId, KitchenGroup);
        await base.OnConnectedAsync();
    }
}
