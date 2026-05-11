using DashTab.Application.Interfaces;
using DashTab.Infrastructure.Persistence;
using Hangfire;
using Microsoft.EntityFrameworkCore;

namespace DashTab.Infrastructure.Services.Jobs;

public class OrderEmailJob(DashTabDbContext db, IEmailService email)
{
    [AutomaticRetry(Attempts = 3, DelaysInSeconds = new[] { 30, 60, 300 })]
    public async Task SendOrderConfirmation(Guid orderId)
    {
        var order = await db.Orders
            .Include(o => o.Items)
            .FirstOrDefaultAsync(o => o.Id == orderId);

        if (order is null) return;

        var rows = string.Join("", order.Items.Select(i =>
            $"<tr><td>{i.MenuItemNameSnapshot}</td><td>{i.Quantity}</td><td>{i.UnitPrice:C}</td><td>{i.LineTotal:C}</td></tr>"));

        var html =
            $"<h2>Order #{order.OrderNumber} Confirmation</h2>" +
            $"<p>Table: {order.TableLabel} | Status: {order.Status} | Placed: {order.PlacedAt:f}</p>" +
            $"<p>Created by: {order.CreatedByName}</p>" +
            "<table border=\"1\" cellpadding=\"6\">" +
            "<thead><tr><th>Item</th><th>Qty</th><th>Unit Price</th><th>Total</th></tr></thead>" +
            $"<tbody>{rows}</tbody>" +
            "</table>" +
            $"<p><strong>Order Total: {order.TotalAmount:C}</strong></p>";

        await email.SendAsync(
            to: "staff@dashtab.dev",
            subject: $"Order #{order.OrderNumber} Confirmed",
            htmlBody: html
        );
    }
}
