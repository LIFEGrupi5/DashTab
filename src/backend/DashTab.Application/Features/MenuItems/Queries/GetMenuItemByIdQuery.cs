using DashTab.Application.Dtos;
using MediatR;

namespace DashTab.Application.Features.MenuItems.Queries;

public record GetMenuItemByIdQuery(Guid Id) : IRequest<MenuItemDto?>;
