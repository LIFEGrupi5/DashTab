using DashTab.Application.Dtos;
using FluentValidation;

namespace DashTab.Application.Validators;

public class UpdateRestaurantRequestValidator : AbstractValidator<UpdateRestaurantRequest>
{
    public UpdateRestaurantRequestValidator()
    {
        RuleFor(x => x.Name).NotEmpty().MaximumLength(200);
    }
}
