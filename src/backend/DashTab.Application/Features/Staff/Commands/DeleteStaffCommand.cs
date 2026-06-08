using MediatR;

namespace DashTab.Application.Features.Staff.Commands;

public record DeleteStaffCommand(Guid Id) : IRequest<bool>;
