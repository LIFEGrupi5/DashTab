using System.ComponentModel.DataAnnotations;
using DashTab.Domain.Enums;

namespace DashTab.Domain.Entities;

public class User
{
    [Key]
    public Guid Id { get; set; }

    [Required, MaxLength(200)]
    public string FullName { get; set; } = string.Empty;

    [Required, MaxLength(200)]
    public string Email { get; set; } = string.Empty;

    public Role Role { get; set; }
    public bool IsActive { get; set; } = true;
    public DateOnly? HireStartDate { get; set; }
    public string? Bio { get; set; }
    public string? PhotoUrl { get; set; }

    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }

    public ICollection<Order> Orders { get; set; } = [];
}
