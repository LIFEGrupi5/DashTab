using FluentValidation;
using MediatR;

namespace DashTab.Application.Behaviors;

/// <summary>
/// MediatR pipeline behavior that runs all registered FluentValidation
/// validators for the incoming request (command/query) before it reaches its
/// handler. On failure it throws <see cref="ValidationException"/>, which
/// <c>DashTabExceptionHandler</c> maps to a 422 ProblemDetails response.
///
/// This centralizes validation in the request pipeline so it applies to every
/// dispatch path (HTTP, background jobs, MCP tools), not just MVC model binding.
/// </summary>
public class ValidationBehavior<TRequest, TResponse>(IEnumerable<IValidator<TRequest>> validators)
    : IPipelineBehavior<TRequest, TResponse>
    where TRequest : notnull
{
    public async Task<TResponse> Handle(
        TRequest request,
        RequestHandlerDelegate<TResponse> next,
        CancellationToken cancellationToken)
    {
        if (validators.Any())
        {
            var context = new ValidationContext<TRequest>(request);
            var results = await Task.WhenAll(
                validators.Select(v => v.ValidateAsync(context, cancellationToken)));

            var failures = results
                .SelectMany(r => r.Errors)
                .Where(f => f is not null)
                .ToList();

            if (failures.Count != 0)
                throw new ValidationException(failures);
        }

        return await next();
    }
}
