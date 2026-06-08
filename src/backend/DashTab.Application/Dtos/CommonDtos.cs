namespace DashTab.Application.Dtos;

// Generic paginated response. Every list endpoint returns this shape so the
// frontend can read `.items`, `.total`, `.skip`, and `.take` uniformly.
public record PagedResult<T>(
    IEnumerable<T> Items,
    int Total,
    int Skip,
    int Take);
