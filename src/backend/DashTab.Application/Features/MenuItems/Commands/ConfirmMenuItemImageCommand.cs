using DashTab.Application.Dtos;
using MediatR;

namespace DashTab.Application.Features.MenuItems.Commands;

public record ConfirmMenuItemImageCommand(Guid Id, string ObjectKey) : IRequest<MenuItemDto?>;
