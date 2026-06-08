using DashTab.Application.Dtos;
using DashTab.Application.Features.Staff.Queries;
using DashTab.Application.Mappings;
using DashTab.Infrastructure.Persistence;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace DashTab.Infrastructure.Features.Staff;

public class ListStaffHandler(DashTabDbContext db, UserMapper mapper)
    : IRequestHandler<ListStaffQuery, PagedResult<StaffUserDto>>
{
    public async Task<PagedResult<StaffUserDto>> Handle(ListStaffQuery request, CancellationToken cancellationToken)
    {
        var query = db.Users.OrderBy(u => u.FullName);
        var total = await query.CountAsync(cancellationToken);
        var users = await query.Skip(request.Skip).Take(request.Take).ToListAsync(cancellationToken);
        return new PagedResult<StaffUserDto>(users.Select(mapper.ToDto), total, request.Skip, request.Take);
    }
}

public class GetStaffByIdHandler(DashTabDbContext db, UserMapper mapper)
    : IRequestHandler<GetStaffByIdQuery, StaffUserDto?>
{
    public async Task<StaffUserDto?> Handle(GetStaffByIdQuery request, CancellationToken cancellationToken)
    {
        var user = await db.Users.FirstOrDefaultAsync(u => u.Id == request.Id, cancellationToken);
        return user is null ? null : mapper.ToDto(user);
    }
}
