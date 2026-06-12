using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Pgvector;

namespace DashTab.Domain.Entities;

public class MenuItem
{
    [Key]
    public Guid Id { get; set; }

    public Guid CategoryId { get; set; }

    [Required, MaxLength(200)]
    public string Name { get; set; } = string.Empty;

    public string Description { get; set; } = string.Empty;

    [Column(TypeName = "numeric(10,2)")]
    public decimal Price { get; set; }

    public bool IsAvailable { get; set; } = true;

    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    public bool IsDeleted { get; set; } = false;

    public string? ImageObjectKey { get; set; }

    // Semantic embedding vector (1536 dims, text-embedding-3-small).
    // Null until the backfill job runs or the item is created/updated with the key set.
    public Vector? Embedding { get; set; }

    public Guid RestaurantId { get; set; }
    public Restaurant Restaurant { get; set; } = null!;

    public MenuCategory Category { get; set; } = null!;
    public ICollection<OrderItem> OrderItems { get; set; } = [];
}
