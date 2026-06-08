using DashTab.Application.Dtos;
using DashTab.Application.Validators;
using FluentValidation;
using MediatR;

namespace DashTab.Application.Features.Restaurants.Commands;

public record RegisterRestaurantCommand(RegisterRestaurantRequest Request)
    : IRequest<RegisterRestaurantResponse>;

public class RegisterRestaurantCommandValidator : AbstractValidator<RegisterRestaurantCommand>
{
    public RegisterRestaurantCommandValidator()
        => RuleFor(c => c.Request).NotNull().SetValidator(new RegisterRestaurantRequestValidator());
}
