using DashTab.Application.Dtos;
using MediatR;

namespace DashTab.Application.Features.MenuItems.Commands;

public record ToggleMenuItemAvailabilityCommand(Guid Id, bool Available) : IRequest<MenuItemDto?>;
