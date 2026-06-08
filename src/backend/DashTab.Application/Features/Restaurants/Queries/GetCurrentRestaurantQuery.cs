using DashTab.Application.Dtos;
using MediatR;

namespace DashTab.Application.Features.Restaurants.Queries;

public record GetCurrentRestaurantQuery : IRequest<RestaurantDto?>;
