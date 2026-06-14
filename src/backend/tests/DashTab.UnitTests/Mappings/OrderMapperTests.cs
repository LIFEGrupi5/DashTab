using DashTab.Application.Dtos;
using DashTab.Application.Mappings;
using DashTab.Domain.Entities;
using DashTab.Domain.Enums;

namespace DashTab.UnitTests.Mappings;

public class OrderMapperTests
{
    private readonly OrderMapper _mapper = new();

    private static Order MakeOrder(OrderStatus status, DateTime placedAt, params (string name, int qty, decimal lineTotal)[] items) =>
        new()
        {
            Id = Guid.NewGuid(),
            OrderNumber = "001",
            TableLabel = "T-3",
            Status = status,
            TotalAmount = items.Sum(i => i.lineTotal),
            CreatedById = Guid.NewGuid(),
            CreatedByName = "Server Sam",
            PlacedAt = placedAt,
            StageEnteredAt = placedAt,
            Items = items.Select(i => new OrderItem
            {
                Id = Guid.NewGuid(),
                MenuItemNameSnapshot = i.name,
                Quantity = i.qty,
                UnitPrice = i.lineTotal / i.qty,
                LineTotal = i.lineTotal,
            }).ToList(),
        };

    [Fact]
    public void ToDto_FormatsTimes_RenamesFields_LowercasesStatus()
    {
        var placed = new DateTime(2025, 5, 7, 14, 30, 0, DateTimeKind.Utc);
        var order = MakeOrder(OrderStatus.Preparing, placed, ("Espresso", 2, 5.00m));

        var dto = _mapper.ToDto(order, placed.AddMinutes(5));

        Assert.Equal(order.Id, dto.Id);
        Assert.Equal("001", dto.OrderNumber);
        Assert.Equal("T-3", dto.TableNumber);
        Assert.Equal("14:30", dto.CreatedAt);
        Assert.Equal("preparing", dto.Status);
        Assert.Equal("Server Sam", dto.CreatedByName);
        Assert.Equal(5.00m, dto.TotalAmount);
        Assert.Equal(placed.ToString("o"), dto.PlacedAtIso);
        Assert.Equal(placed.ToString("o"), dto.StageEnteredAtIso);
    }

    [Fact]
    public void ToDto_ItemsRenameSnapshotAndLineTotal()
    {
        var placed = DateTime.UtcNow;
        var order = MakeOrder(OrderStatus.New, placed,
            ("Espresso", 2, 5.00m),
            ("Latte", 1, 3.50m));

        var dto = _mapper.ToDto(order, placed);
        var items = dto.Items.ToList();

        Assert.Equal(2, items.Count);
        Assert.Equal("Espresso", items[0].MenuItemName);
        Assert.Equal(2, items[0].Quantity);
        Assert.Equal(5.00m, items[0].Amount);
        Assert.Equal("Latte", items[1].MenuItemName);
        Assert.Equal(3.50m, items[1].Amount);
    }

    [Theory]
    [InlineData(OrderStatus.New, "new")]
    [InlineData(OrderStatus.Preparing, "preparing")]
    [InlineData(OrderStatus.Ready, "ready")]
    [InlineData(OrderStatus.Completed, "completed")]
    [InlineData(OrderStatus.Cancelled, "cancelled")]
    public void ToDto_StatusLowercase(OrderStatus status, string expected)
    {
        var order = MakeOrder(status, DateTime.UtcNow);

        var dto = _mapper.ToDto(order, DateTime.UtcNow);

        Assert.Equal(expected, dto.Status);
    }

    [Fact]
    public void Delayed_True_WhenNewAndOver30Minutes()
    {
        var placed = new DateTime(2025, 5, 7, 12, 0, 0, DateTimeKind.Utc);
        var order = MakeOrder(OrderStatus.New, placed);

        var dto = _mapper.ToDto(order, placed.AddMinutes(31));

        Assert.True(dto.Delayed);
    }

    [Fact]
    public void Delayed_False_AtThreshold()
    {
        var placed = new DateTime(2025, 5, 7, 12, 0, 0, DateTimeKind.Utc);
        var order = MakeOrder(OrderStatus.Preparing, placed);

        var dto = _mapper.ToDto(order, placed.AddMinutes(30));

        Assert.False(dto.Delayed);
    }

    [Theory]
    [InlineData(OrderStatus.Ready)]
    [InlineData(OrderStatus.Completed)]
    [InlineData(OrderStatus.Cancelled)]
    public void Delayed_False_ForTerminalStatuses_EvenIfOld(OrderStatus status)
    {
        var placed = new DateTime(2025, 5, 7, 12, 0, 0, DateTimeKind.Utc);
        var order = MakeOrder(status, placed);

        var dto = _mapper.ToDto(order, placed.AddHours(2));

        Assert.False(dto.Delayed);
    }
}
