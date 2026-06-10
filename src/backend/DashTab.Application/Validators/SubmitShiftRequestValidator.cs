using DashTab.Application.Dtos;
using DashTab.Domain.Enums;
using FluentValidation;

namespace DashTab.Application.Validators;

public class SubmitShiftRequestValidator : AbstractValidator<SubmitShiftRequestDto>
{
    public SubmitShiftRequestValidator()
    {
        RuleFor(x => x.RequestedDate).NotEmpty();

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
}
