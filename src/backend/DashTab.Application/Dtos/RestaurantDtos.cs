namespace DashTab.Application.Dtos;

public record RegisterRestaurantRequest(
    string RestaurantName,
    string OwnerFullName,
    string OwnerEmail,
    string OwnerPassword);

public record RegisterRestaurantResponse(
    Guid RestaurantId,
    string RestaurantName,
    string Slug);

public record RestaurantDto(
    Guid Id,
    string Name,
    string Slug,
    DateTime CreatedAt);

public record UpdateRestaurantRequest(string Name);
