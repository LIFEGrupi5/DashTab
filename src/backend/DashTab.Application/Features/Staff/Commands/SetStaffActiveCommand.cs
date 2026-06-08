using DashTab.Application.Dtos;
using MediatR;

namespace DashTab.Application.Features.Staff.Commands;

public record SetStaffActiveCommand(Guid Id, bool Active) : IRequest<StaffUserDto?>;
