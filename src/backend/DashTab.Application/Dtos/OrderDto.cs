namespace DashTab.Application.Dtos;

public class OrderDto
{
    public Guid Id { get; set; }
    public int TableNumber { get; set; }
    public string Status { get; set; } = string.Empty;
}
