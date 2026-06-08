using DashTab.Application.Dtos;
using MediatR;

namespace DashTab.Application.Features.Auth.Queries;

public record GetCurrentUserQuery : IRequest<StaffUserDto?>;
