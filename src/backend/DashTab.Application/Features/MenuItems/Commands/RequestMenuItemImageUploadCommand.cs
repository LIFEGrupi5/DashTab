using DashTab.Application.Dtos;
using DashTab.Application.Validators;
using FluentValidation;
using MediatR;

namespace DashTab.Application.Features.MenuItems.Commands;

public record RequestMenuItemImageUploadCommand(Guid Id, ImageUploadRequest Request)
    : IRequest<PresignedUploadUrl?>;

public class RequestMenuItemImageUploadCommandValidator : AbstractValidator<RequestMenuItemImageUploadCommand>
{
    public RequestMenuItemImageUploadCommandValidator()
        => RuleFor(c => c.Request).NotNull().SetValidator(new ImageUploadRequestValidator());
}
