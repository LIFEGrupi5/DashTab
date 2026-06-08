using DashTab.Application.Dtos;
using DashTab.Application.Validators;
using FluentValidation;
using MediatR;

namespace DashTab.Application.Features.MenuItems.Commands;

public record CreateMenuItemCommand(CreateMenuItemRequest Request) : IRequest<MenuItemDto>;

public class CreateMenuItemCommandValidator : AbstractValidator<CreateMenuItemCommand>
{
    public CreateMenuItemCommandValidator()
        => RuleFor(c => c.Request).NotNull().SetValidator(new CreateMenuItemRequestValidator());
}
