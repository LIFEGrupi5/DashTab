using DashTab.Application.Dtos;
using DashTab.Application.Validators;
using FluentValidation;
using MediatR;

namespace DashTab.Application.Features.Auth.Commands;

public record LoginCommand(LoginRequest Request) : IRequest<TokenResponse>;

public class LoginCommandValidator : AbstractValidator<LoginCommand>
{
    public LoginCommandValidator()
        => RuleFor(c => c.Request).NotNull().SetValidator(new LoginRequestValidator());
}
