using DashTab.Domain.Exceptions;
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

          context.Response.StatusCode = status;
          await context.Response.WriteAsJsonAsync(problem, cancellationToken);
          return true;
      }
  }
