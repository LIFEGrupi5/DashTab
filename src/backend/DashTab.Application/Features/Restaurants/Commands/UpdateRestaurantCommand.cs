using DashTab.Application.Dtos;
using DashTab.Application.Validators;
using FluentValidation;
using MediatR;

namespace DashTab.Application.Features.Restaurants.Commands;

public record UpdateRestaurantCommand(UpdateRestaurantRequest Request) : IRequest<RestaurantDto?>;

public class UpdateRestaurantCommandValidator : AbstractValidator<UpdateRestaurantCommand>
{
    public UpdateRestaurantCommandValidator()
        => RuleFor(c => c.Request).NotNull().SetValidator(new UpdateRestaurantRequestValidator());
}
