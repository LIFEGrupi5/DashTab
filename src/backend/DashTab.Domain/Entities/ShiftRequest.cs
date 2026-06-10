using System.ComponentModel.DataAnnotations;
using DashTab.Domain.Enums;

namespace DashTab.Domain.Entities;

public class ShiftRequest
{
    [Key]
    public Guid Id { get; set; }

    public Guid RestaurantId { get; set; }
    public Restaurant Restaurant { get; set; } = null!;

    public Guid RequesterId { get; set; }
    public User Requester { get; set; } = null!;

    public ShiftRequestType Type { get; set; }
    public ShiftRequestStatus Status { get; set; } = ShiftRequestStatus.Pending;

    // The day the requester wants off (RestDay) or wants to swap away (ShiftSwap).
    public DateOnly RequestedDate { get; set; }

    // Only populated for ShiftSwap — who they want to swap with and which of their days.
    public Guid? TargetUserId { get; set; }
    public User? TargetUser { get; set; }
    public DateOnly? TargetDate { get; set; }

    [MaxLength(500)]
    public string? Reason { get; set; }

    [MaxLength(500)]
    public string? ManagerNote { get; set; }

    public DateTime CreatedAt { get; set; }
    public DateTime? ReviewedAt { get; set; }
}
