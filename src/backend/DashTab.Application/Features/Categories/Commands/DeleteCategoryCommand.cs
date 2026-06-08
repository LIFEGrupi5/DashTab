using MediatR;

namespace DashTab.Application.Features.Categories.Commands;

public record DeleteCategoryCommand(Guid Id) : IRequest<bool>;
