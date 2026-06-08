using DashTab.Application.Dtos;
using DashTab.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace DashTab.API.Controllers;

[Authorize]
[ApiController]
[Route("api/v1/menu-categories")]
public class MenuCategoriesController(ICategoryService categoryService) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetAll() =>
        Ok(await categoryService.ListAsync());

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetById(Guid id)
    {
        var cat = await categoryService.GetByIdAsync(id);
        return cat is null ? NotFound() : Ok(cat);
    }

    [Authorize(Roles = "Owner,Manager")]
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateCategoryRequest request)
    {
        var cat = await categoryService.CreateAsync(request);
        return CreatedAtAction(nameof(GetById), new { id = cat.Id }, cat);
    }

    [Authorize(Roles = "Owner,Manager")]
    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateCategoryRequest request)
    {
        var cat = await categoryService.UpdateAsync(id, request);
        return cat is null ? NotFound() : Ok(cat);
    }

    [Authorize(Roles = "Owner,Manager")]
    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        try
        {
            var deleted = await categoryService.DeleteAsync(id);
            return deleted ? NoContent() : NotFound();
        }
        catch (InvalidOperationException ex)
        {
            return UnprocessableEntity(new { error = ex.Message });
        }
    }
}
