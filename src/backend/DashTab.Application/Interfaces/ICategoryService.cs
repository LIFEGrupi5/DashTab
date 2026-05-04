using DashTab.Application.Dtos;

namespace DashTab.Application.Interfaces;

public interface ICategoryService
{
    Task<IEnumerable<MenuCategoryDto>> ListAsync();
    Task<MenuCategoryDto?> GetByIdAsync(Guid id);
    Task<MenuCategoryDto> CreateAsync(CreateCategoryRequest request);
    Task<MenuCategoryDto?> UpdateAsync(Guid id, UpdateCategoryRequest request);
    Task<bool> DeleteAsync(Guid id);
}
