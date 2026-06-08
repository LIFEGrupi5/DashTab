using DashTab.Application.Dtos;
using MediatR;

namespace DashTab.Application.Features.Staff.Queries;

public record GetStaffByIdQuery(Guid Id) : IRequest<StaffUserDto?>;
