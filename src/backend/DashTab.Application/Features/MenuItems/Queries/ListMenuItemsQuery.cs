using DashTab.Application.Dtos;
using MediatR;

namespace DashTab.Application.Features.MenuItems.Queries;

public record ListMenuItemsQuery(
    Guid? CategoryId = null,
    string? Search = null,
    bool? Available = null,
    int Skip = 0,
    int Take = 50) : IRequest<PagedResult<MenuItemDto>>;
