namespace DashTab.Domain.Exceptions;

public class InvalidStateTransitionException(string from, string to)
    : InvalidOperationException($"Cannot transition order from '{from}' to '{to}'.");
