using DashTab.Application.Dtos;
using DashTab.Application.Validators;
using FluentValidation;
using MediatR;

namespace DashTab.Application.Features.Staff.Commands;

public record CreateStaffCommand(CreateStaffRequest Request) : IRequest<StaffUserDto>;

public class CreateStaffCommandValidator : AbstractValidator<CreateStaffCommand>
{
    public CreateStaffCommandValidator()
        => RuleFor(c => c.Request).NotNull().SetValidator(new CreateStaffRequestValidator());
}
