using DashTab.Application.Dtos;
using FluentValidation;

namespace DashTab.Application.Validators;

public class CreateStaffRequestValidator : AbstractValidator<CreateStaffRequest>
{
    public CreateStaffRequestValidator()
    {
        RuleFor(x => x.FullName).NotEmpty().MaximumLength(200);
        RuleFor(x => x.Email).NotEmpty().EmailAddress();
        RuleFor(x => x.Role).NotEmpty().Must(r => new[] { "Owner", "Manager", "Waiter", "Kitchen" }.Contains(r));
    }
}