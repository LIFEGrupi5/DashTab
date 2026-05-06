using DashTab.Application.Dtos;
using DashTab.Domain.Enums;
using FluentValidation;

namespace DashTab.Application.Validators;

public class CreateStaffRequestValidator : AbstractValidator<CreateStaffRequest>
{
    private static readonly IEnumerable<string> ValidRoles =
        Enum.GetNames<Role>().Select(r => r.ToLower());

    public CreateStaffRequestValidator()
    {
        RuleFor(x => x.FullName).NotEmpty().MaximumLength(200);
        RuleFor(x => x.Email).NotEmpty().EmailAddress().MaximumLength(256);
        RuleFor(x => x.Role)
            .NotEmpty()
            .Must(r => ValidRoles.Contains(r.ToLower()))
            .WithMessage($"Role must be one of: {string.Join(", ", ValidRoles)}.");
        RuleFor(x => x.Bio).MaximumLength(1000).When(x => x.Bio is not null);
    }
}

public class UpdateStaffRequestValidator : AbstractValidator<UpdateStaffRequest>
{
    private static readonly IEnumerable<string> ValidRoles =
        Enum.GetNames<Role>().Select(r => r.ToLower());

    public UpdateStaffRequestValidator()
    {
        RuleFor(x => x.FullName).NotEmpty().MaximumLength(200);
        RuleFor(x => x.Email).NotEmpty().EmailAddress().MaximumLength(256);
        RuleFor(x => x.Role)
            .NotEmpty()
            .Must(r => ValidRoles.Contains(r.ToLower()))
            .WithMessage($"Role must be one of: {string.Join(", ", ValidRoles)}.");
        RuleFor(x => x.Bio).MaximumLength(1000).When(x => x.Bio is not null);
        RuleFor(x => x.PhotoUrl).MaximumLength(2048).When(x => x.PhotoUrl is not null);
    }
}
