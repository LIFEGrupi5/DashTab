using DashTab.Application.Dtos;
using DashTab.Application.Validators;
using FluentValidation;
using MediatR;

namespace DashTab.Application.Features.Categories.Commands;

public record UpdateCategoryCommand(Guid Id, UpdateCategoryRequest Request) : IRequest<MenuCategoryDto?>;

public class UpdateCategoryCommandValidator : AbstractValidator<UpdateCategoryCommand>
{
    public UpdateCategoryCommandValidator()
        => RuleFor(c => c.Request).NotNull().SetValidator(new UpdateCategoryRequestValidator());
}
