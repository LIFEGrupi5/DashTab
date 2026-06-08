using DashTab.Application.Dtos;
using DashTab.Application.Validators;
using FluentValidation;
using MediatR;

namespace DashTab.Application.Features.Staff.Commands;

public record UpdateStaffCommand(Guid Id, UpdateStaffRequest Request) : IRequest<StaffUserDto?>;

public class UpdateStaffCommandValidator : AbstractValidator<UpdateStaffCommand>
{
    public UpdateStaffCommandValidator()
        => RuleFor(c => c.Request).NotNull().SetValidator(new UpdateStaffRequestValidator());
}
