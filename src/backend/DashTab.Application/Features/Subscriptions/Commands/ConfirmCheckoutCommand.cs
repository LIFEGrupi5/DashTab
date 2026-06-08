using DashTab.Application.Dtos;
using MediatR;

namespace DashTab.Application.Features.Subscriptions.Commands;

public record ConfirmCheckoutCommand(ConfirmCheckoutRequest Request) : IRequest<SubscriptionDto>;
