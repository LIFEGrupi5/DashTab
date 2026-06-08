using DashTab.Application.Dtos;
using MediatR;

namespace DashTab.Application.Features.Subscriptions.Queries;

public record GetCurrentSubscriptionQuery : IRequest<SubscriptionDto?>;
