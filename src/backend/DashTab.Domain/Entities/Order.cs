using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using DashTab.Domain.Enums;

namespace DashTab.Domain.Entities;

public class Order
{
    [Key]
    public Guid Id { get; set; }

    [Required, MaxLength(50)]
    public string OrderNumber { get; set; } = string.Empty;

    [Required, MaxLength(50)]
    public string TableLabel { get; set; } = string.Empty;

    public OrderStatus Status { get; set; } = OrderStatus.New;

    [Column(TypeName = "numeric(10,2)")]
    public decimal TotalAmount { get; set; }

    public string? Notes { get; set; }

    public Guid CreatedById { get; set; }

    [Required, MaxLength(200)]
    public string CreatedByName { get; set; } = string.Empty;

    public DateTime PlacedAt { get; set; }
    public DateTime StageEnteredAt { get; set; }

    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }

    public User CreatedBy { get; set; } = null!;
    public ICollection<OrderItem> Items { get; set; } = [];
}
