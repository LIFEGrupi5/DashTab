using DashTab.Application.Dtos;
using DashTab.Application.Validators;
using FluentValidation;
using MediatR;

namespace DashTab.Application.Features.MenuItems.Commands;

public record UpdateMenuItemCommand(Guid Id, UpdateMenuItemRequest Request) : IRequest<MenuItemDto?>;

public class UpdateMenuItemCommandValidator : AbstractValidator<UpdateMenuItemCommand>
{
    public UpdateMenuItemCommandValidator()
        => RuleFor(c => c.Request).NotNull().SetValidator(new UpdateMenuItemRequestValidator());
}
