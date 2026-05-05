using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace DashTab.Domain.Entities;

public class OrderItem
{
    [Key]
    public Guid Id { get; set; }

    public Guid OrderId { get; set; }
    public Guid? MenuItemId { get; set; }

    [Required, MaxLength(200)]
    public string MenuItemNameSnapshot { get; set; } = string.Empty;

    public int Quantity { get; set; }

    [Column(TypeName = "numeric(10,2)")]
    public decimal UnitPrice { get; set; }

    [Column(TypeName = "numeric(10,2)")]
    public decimal LineTotal { get; set; }

    public Order Order { get; set; } = null!;
    public MenuItem? MenuItem { get; set; }
}
