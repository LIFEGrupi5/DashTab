using System.ComponentModel.DataAnnotations;

namespace DashTab.Domain.Entities;

public class MenuCategory
{
    [Key]
    public Guid Id { get; set; }

    [Required, MaxLength(100)]
    public string Name { get; set; } = string.Empty;

    public int DisplayOrder { get; set; }

    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }

    public ICollection<MenuItem> MenuItems { get; set; } = [];
}
