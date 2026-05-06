using DashTab.Application.Dtos;
using FluentValidation;

namespace DashTab.Application.Validators;

public class UpdateMenuItemRequestValidator : AbstractValidator<UpdateMenuItemRequest>
{
    public UpdateMenuItemRequestValidator()
    {
        RuleFor(x => x.Name).NotEmpty().MaximumLength(200);
        RuleFor(x => x.Price).GreaterThan(0);
        RuleFor(x => x.CategoryId).NotEmpty();
    }
}