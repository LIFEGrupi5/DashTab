namespace DashTab.Domain.Entities;

public class Order
{
    public Guid Id { get; set; }
    public int TableNumber { get; set; }
    public string Status { get; set; } = string.Empty;
}
