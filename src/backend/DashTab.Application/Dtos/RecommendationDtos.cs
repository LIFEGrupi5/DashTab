namespace DashTab.Application.Dtos;

// What the public /recommend endpoint returns.
public record RecommendationResponse(
    string? Message,
    IEnumerable<RecommendedItemDto> Items);

// Safe subset of MenuItem for anonymous customers — no internal IDs beyond what's
// needed to display the recommendation (name, description, price, optional image URL).
public record RecommendedItemDto(
    string Name,
    string Description,
    decimal Price,
    string? ImageUrl);

// What the public endpoint accepts.
public record RecommendationRequest(string Query);
