using System.ComponentModel.DataAnnotations;

namespace DashTab.Domain.Entities;

public class AuditLog
{
    [Key]
    public Guid Id { get; set; }

    [Required]
    [MaxLength(100)]
    public string EntityName { get; set; } = string.Empty;
    
    public Guid EntityId { get; set; }

    [Required]
    [MaxLength(50)]
    public string Action { get; set; } = string.Empty;

    [MaxLength(200)]
    public string? ChangedBy { get; set; }

    public DateTime ChangedAt { get; set; }

    public string? OldValues { get; set; }

    public string? NewValues { get; set; }

    public Guid RestaurantId { get; set; }
}