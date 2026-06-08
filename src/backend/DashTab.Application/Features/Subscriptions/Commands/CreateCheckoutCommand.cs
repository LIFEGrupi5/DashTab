using DashTab.Application.Dtos;
using MediatR;

namespace DashTab.Application.Features.Subscriptions.Commands;

public record CreateCheckoutCommand(CreateCheckoutRequest Request) : IRequest<CreateCheckoutResponse>;
