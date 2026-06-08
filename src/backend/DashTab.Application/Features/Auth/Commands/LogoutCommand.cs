using MediatR;

namespace DashTab.Application.Features.Auth.Commands;

public record LogoutCommand(string RefreshToken) : IRequest;
