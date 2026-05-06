using DashTab.Application.Dtos;
using FluentValidation;

namespace DashTab.Application.Validators;

public class CreateOrderRequestValidator : AbstractValidator<CreateOrderRequest>
{
    public CreateOrderRequestValidator()
    {
        RuleFor(x => x.TableNumber).NotEmpty();
        RuleFor(x => x.Items).NotEmpty();
        RuleForEach(x => x.Items).ChildRules(item =>
        {
            item.RuleFor(x => x.Quantity).GreaterThanOrEqualTo(1);
            item.RuleFor(x => x.MenuItemId).NotEmpty();
        });
    }
}