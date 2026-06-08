using DashTab.Application.Dtos;
using DashTab.Application.Features.Categories.Commands;
using DashTab.Application.Features.Categories.Queries;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace DashTab.API.Controllers;

[Authorize]
[ApiController]
[Route("api/v1/menu-categories")]
public class MenuCategoriesController(ISender sender) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetAll() =>
        Ok(await sender.Send(new ListCategoriesQuery()));

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetById(Guid id)
    {
        var cat = await sender.Send(new GetCategoryByIdQuery(id));
        return cat is null ? NotFound() : Ok(cat);
    }

    [Authorize(Roles = "Owner,Manager")]
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateCategoryRequest request)
    {
        var cat = await sender.Send(new CreateCategoryCommand(request));
        return CreatedAtAction(nameof(GetById), new { id = cat.Id }, cat);
    }

    [Authorize(Roles = "Owner,Manager")]
    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateCategoryRequest request)
    {
        var cat = await sender.Send(new UpdateCategoryCommand(id, request));
        return cat is null ? NotFound() : Ok(cat);
    }

    [Authorize(Roles = "Owner,Manager")]
    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        try
        {
            var deleted = await sender.Send(new DeleteCategoryCommand(id));
            return deleted ? NoContent() : NotFound();
        }
        catch (InvalidOperationException ex)
        {
            return UnprocessableEntity(new { error = ex.Message });
        }
    }
}
