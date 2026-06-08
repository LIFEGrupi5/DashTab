using MediatR;

namespace DashTab.Application.Features.MenuItems.Commands;

public record DeleteMenuItemCommand(Guid Id) : IRequest<bool>;
