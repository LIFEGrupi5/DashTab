using MediatR;

namespace DashTab.Application.Features.MenuItems.Commands;

public record RemoveMenuItemImageCommand(Guid Id) : IRequest<bool>;
