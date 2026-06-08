using DashTab.Application.Validators;
using FluentValidation;

namespace DashTab.Application.Features.Orders.Commands;

/// <summary>
/// Validates the wrapped request by delegating to the existing
/// <see cref="CreateOrderRequestValidator"/>, so validation rules live in one place.
/// </summary>
public class CreateOrderCommandValidator : AbstractValidator<CreateOrderCommand>
{
    public CreateOrderCommandValidator()
    {
        RuleFor(c => c.Request).NotNull().SetValidator(new CreateOrderRequestValidator());
    }
}
