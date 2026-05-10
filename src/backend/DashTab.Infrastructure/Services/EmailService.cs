using DashTab.Application.Interfaces;
using MailKit.Net.Smtp;
using Microsoft.Extensions.Configuration;
using MimeKit;

namespace DashTab.Infrastructure.Services;

public class EmailService(IConfiguration config) : IEmailService
{
    public async Task SendAsync(string to, string subject, string htmlBody)
    {
        var message = new MimeMessage();
        message.From.Add(MailboxAddress.Parse(config["Smtp:From"]));
        message.To.Add(MailboxAddress.Parse(to));
        message.Subject = subject;
        message.Body = new TextPart("html") { Text = htmlBody };

        using var client = new SmtpClient();
        await client.ConnectAsync(config["Smtp:Host"], int.Parse(config["Smtp:Port"]!));
        await client.SendAsync(message);
        await client.DisconnectAsync(true);
    }
}