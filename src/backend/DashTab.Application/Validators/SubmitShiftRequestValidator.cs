using DashTab.Application.Dtos;
using DashTab.Domain.Enums;
using FluentValidation;

namespace DashTab.Application.Validators;

public class SubmitShiftRequestValidator : AbstractValidator<SubmitShiftRequestDto>
{
    public SubmitShiftRequestValidator()
    {
        RuleFor(x => x.RequestedDate).NotEmpty();

        // A rest day can only be requested for a future week — not for a past
        // date or any day in the current week. (Evaluated at validation time so
        // "today" is always fresh, regardless of validator lifetime.)
        When(x => x.Type == ShiftRequestType.RestDay, () =>
        {
            RuleFor(x => x.RequestedDate)
                .Must(BeInAFutureWeek)
                .WithMessage("You can only request a rest day for a future week — not for a past date or the current week.");
        });

        // Swap requests must say who to swap with and which of their days
        When(x => x.Type == ShiftRequestType.ShiftSwap, () =>
        {
            RuleFor(x => x.TargetUserId)
                .NotNull().WithMessage("TargetUserId is required for a shift swap.");
            RuleFor(x => x.TargetDate)
                .NotNull().WithMessage("TargetDate is required for a shift swap.");
        });

        RuleFor(x => x.Reason).MaximumLength(500).When(x => x.Reason != null);
    }

    // True only when the date falls in a later week than the one containing today.
    private static bool BeInAFutureWeek(DateOnly date)
    {
        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        var daysSinceMonday = ((int)today.DayOfWeek + 6) % 7; // Mon=0 … Sun=6
        var currentWeekSunday = today.AddDays(6 - daysSinceMonday);
        return date > currentWeekSunday;
    }
}
