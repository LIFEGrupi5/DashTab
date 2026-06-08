using DashTab.Application.Dtos;
using MediatR;

namespace DashTab.Application.Features.Categories.Queries;

public record ListCategoriesQuery : IRequest<IEnumerable<MenuCategoryDto>>;
