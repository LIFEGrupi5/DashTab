using System.ComponentModel.DataAnnotations;

namespace DashTab.Domain.Entities;

public class WorkShift
{
    [Key]
    public Guid Id { get; set; }

    public Guid RestaurantId { get; set; }
    public Restaurant Restaurant { get; set; } = null!;

    public Guid UserId { get; set; }
    public User User { get; set; } = null!;

    // Always a Monday — grouping key for "load week X" queries.
    public DateOnly WeekStartDate { get; set; }
    public DayOfWeek DayOfWeek { get; set; }

    public TimeOnly StartTime { get; set; }
    public TimeOnly EndTime { get; set; }

    public bool IsDayOff { get; set; } = false;

    // Workers can only see their schedule once the manager publishes the week.
    public bool IsPublished { get; set; } = false;

    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}
