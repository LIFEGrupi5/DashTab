namespace DashTab.Application.Interfaces;

public interface ICurrentUser
{
    Guid Id { get; }
    string? Email { get; }
    IReadOnlyList<string> Roles { get; }
}