using DashTab.Application.Dtos;
using FluentValidation;

namespace DashTab.Application.Validators;

public class RegisterRestaurantRequestValidator : AbstractValidator<RegisterRestaurantRequest>
{
    public RegisterRestaurantRequestValidator()
    {
        RuleFor(x => x.RestaurantName).NotEmpty().MaximumLength(200);
        RuleFor(x => x.OwnerFullName).NotEmpty().MaximumLength(200);
        RuleFor(x => x.OwnerEmail).NotEmpty().EmailAddress().MaximumLength(200);
        RuleFor(x => x.OwnerPassword).NotEmpty().MinimumLength(8);
    }
}
