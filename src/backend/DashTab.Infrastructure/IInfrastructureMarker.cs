namespace DashTab.Infrastructure;

/// <summary>
/// Assembly marker for the Infrastructure layer. Used by MediatR's
/// <c>RegisterServicesFromAssemblyContaining</c> to discover request handlers,
/// which live here because they depend on <c>DashTabDbContext</c> and other
/// infrastructure concerns (the request/query records themselves live in Application).
/// </summary>
public interface IInfrastructureMarker;
