using DashTab.Domain.Exceptions;
using FluentValidation;
using Microsoft.AspNetCore.Diagnostics;
using Microsoft.AspNetCore.Mvc;

namespace DashTab.API.Middleware;

public class DashTabExceptionHandler : IExceptionHandler
{
    public async ValueTask<bool> TryHandleAsync(HttpContext context, Exception exception,
        CancellationToken cancellationToken)
    {
        var (status, title) = exception switch
        {
            ValidationException => (422, "Validation Failed"),
            UnauthorizedAccessException => (401, "Unauthorized"),
            InvalidStateTransitionException => (422, "Invalid State Transition"),
            InvalidOperationException => (400, "Bad Request"),
            KeyNotFoundException => (404, "Not Found"),
            _ => (500, "Internal Server Error")
        };

        var problem = new ProblemDetails
        {
            Status = status,
            Title = title,
            Detail = exception.Message,
            Extensions = { ["traceId"] = context.TraceIdentifier }
        };

        if (exception is ValidationException vex)
        {
            problem.Extensions["errors"] = vex.Errors
                .GroupBy(e => e.PropertyName)
                .ToDictionary(g => g.Key, g => g.Select(e => e.ErrorMessage).ToArray());
        }

        context.Response.StatusCode = status;
        await context.Response.WriteAsJsonAsync(problem, cancellationToken);
        return true;
    }
}