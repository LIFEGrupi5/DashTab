using DashTab.Application.Dtos;
using MediatR;

namespace DashTab.Application.Features.Auth.Commands;

public record RefreshTokenCommand(string RefreshToken) : IRequest<TokenResponse>;
