using DashTab.Application.Dtos;
using MediatR;

namespace DashTab.Application.Features.Analytics.Queries;

public record GetRevenueForecastQuery : IRequest<RevenueForecastResponse>;
