using DashTab.Application.Dtos;
using MediatR;

namespace DashTab.Application.Features.Staff.Queries;

public record ListStaffQuery(int Skip = 0, int Take = 50) : IRequest<PagedResult<StaffUserDto>>;
