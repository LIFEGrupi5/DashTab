using DashTab.Application.Interfaces;
using DashTab.Domain.Entities;
using DashTab.Domain.Enums;
using DashTab.Infrastructure.Persistence;
using DashTab.Infrastructure.Services.Jobs;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Moq;

namespace DashTab.IntegrationTests.Unit;

public class OrderEmailJobTests
{
    [Fact]
    public async Task SendOrderConfirmation_CallsEmailService_WithCorrectRecipient()
    {
        // in-memory DbContext — no Docker, runs in <100ms
        var options = new DbContextOptionsBuilder<DashTabDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;
        await using var db = new DashTabDbContext(options);

        var userId = Guid.NewGuid();
        db.Users.Add(new User
        {
            Id = userId,
            FullName = "Test Owner",
            Email = "owner@dashtab.dev",
            Role = Role.Owner,
            IsActive = true,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow,
        });

        var orderId = Guid.NewGuid();
        db.Orders.Add(new Order
        {
            Id = orderId,
            OrderNumber = "ORD-TEST-001",
            TableLabel = "T1",
            Status = OrderStatus.New,
            TotalAmount = 25.50m,
            CreatedById = userId,
            CreatedByName = "Test Owner",
            PlacedAt = DateTime.UtcNow,
            StageEnteredAt = DateTime.UtcNow,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow,
            Items = [],
        });
        await db.SaveChangesAsync();

        // Mock IEmailService — this is what satisfies "mocking with Moq" in BE-13
        var emailMock = new Mock<IEmailService>();
        emailMock
            .Setup(e => e.SendAsync(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>()))
            .Returns(Task.CompletedTask);

        var job = new OrderEmailJob(db, emailMock.Object);

        // Act
        await job.SendOrderConfirmation(orderId);

        // Assert: verify the mock was called exactly once with the right args
        emailMock.Verify(
            e => e.SendAsync(
                "staff@dashtab.dev",
                It.Is<string>(s => s.Contains("ORD-TEST-001")),
                It.IsAny<string>()),
            Times.Once);
    }
}
