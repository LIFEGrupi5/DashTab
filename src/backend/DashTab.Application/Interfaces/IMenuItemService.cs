using DashTab.Application.Dtos;

namespace DashTab.Application.Interfaces;

public interface IMenuItemService
{
    Task<IEnumerable<MenuItemDto>> ListAsync(Guid? categoryId = null, string? search = null, bool? available = null);
    Task<MenuItemDto?> GetByIdAsync(Guid id);
    Task<MenuItemDto> CreateAsync(CreateMenuItemRequest request);
    Task<MenuItemDto?> UpdateAsync(Guid id, UpdateMenuItemRequest request);
    Task<MenuItemDto?> ToggleAvailabilityAsync(Guid id, bool available);
    Task<bool> DeleteAsync(Guid id);
}
