using System.Net;
using Hangfire.Dashboard;

namespace DashTab.API.Hangfire;

public class OwnerOnlyDashboardFilter : IDashboardAuthorizationFilter
{
    public bool Authorize(DashboardContext context)
    {
        var httpContext = context.GetHttpContext();
        var remoteIp = httpContext.Connection.RemoteIpAddress;
        if (remoteIp != null && IPAddress.IsLoopback(remoteIp))
            return true;
        return httpContext.User.Identity?.IsAuthenticated == true
            && httpContext.User.IsInRole("Owner");
    }
}