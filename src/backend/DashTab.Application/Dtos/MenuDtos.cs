namespace DashTab.Application.Dtos;

public record MenuCategoryDto(Guid Id, string Name, int DisplayOrder);

public record CreateCategoryRequest(string Name, int DisplayOrder = 0);

public record UpdateCategoryRequest(string Name, int DisplayOrder);

// Shape matches frontend MenuItem: { id, name, category (string), price, description, available }
public record MenuItemDto(
    Guid Id,
    string Name,
    string Category,
    decimal Price,
    string Description,
    bool Available,
    string? ImageUrl = null);

public record CreateMenuItemRequest(
    string Name,
    Guid CategoryId,
    decimal Price,
    string Description,
    bool Available = true);

public record UpdateMenuItemRequest(
    string Name,
    Guid CategoryId,
    decimal Price,
    string Description,
    bool Available);

public record ToggleAvailabilityRequest(bool Available);

public record ImageUploadRequest(string FileExtension);

public record CommitImageRequest(string ObjectKey);
