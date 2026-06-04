using DashTab.Infrastructure.Persistence;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;

namespace DashTab.Infrastructure.Middleware;

// Runs after UseAuthentication. For every authenticated request, looks up the
// user's RestaurantId from the DB once by email (the same link AuthService uses)
// and stores it on both the DbContext and HttpContext.Items so downstream code
// (CurrentUser, KdsHub) can read it cheaply without hitting the DB again.
public class RestaurantContextMiddleware(RequestDelegate next)
{
    public async Task InvokeAsync(HttpContext ctx, DashTabDbContext db)
    {
        if (ctx.User.Identity?.IsAuthenticated == true)
        {
            var email = ctx.User.FindFirst("email")?.Value;
            if (!string.IsNullOrEmpty(email))
            {
                var restaurantId = await db.Users
                    .IgnoreQueryFilters()
                    .Where(u => u.Email == email && !u.IsDeleted)
                    .Select(u => (Guid?)u.RestaurantId)
                    .FirstOrDefaultAsync();

                if (restaurantId.HasValue)
                {
                    db.CurrentTenantId = restaurantId.Value;
                    ctx.Items["RestaurantId"] = restaurantId.Value;
                }
            }
        }

        await next(ctx);
    }
}
