using DashTab.Application.Dtos;
using MediatR;

namespace DashTab.Application.Features.Categories.Queries;

public record GetCategoryByIdQuery(Guid Id) : IRequest<MenuCategoryDto?>;
