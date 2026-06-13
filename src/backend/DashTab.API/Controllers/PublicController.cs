using DashTab.Application.Dtos;
using DashTab.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace DashTab.API.Controllers;

/// <summary>
/// Unauthenticated endpoints for customers. No JWT required.
/// Tenant isolation is enforced by the restaurantId route parameter, not the JWT.
/// </summary>
[ApiController]
[Route("api/v1/public")]
[AllowAnonymous]
public class PublicController(IRecommendationService recommendation) : ControllerBase
{
    /// <summary>
    /// Customer-facing AI recommendation: takes a craving and returns
    /// semantically-matched menu items + an LLM-written blurb.
    /// </summary>
    [HttpPost("restaurants/{restaurantId:guid}/recommend")]
    public async Task<IActionResult> Recommend(
        Guid restaurantId,
        [FromBody] RecommendationRequest request,
        CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(request.Query))
            return BadRequest(new { error = "Query cannot be empty." });

        var result = await recommendation.RecommendAsync(restaurantId, request.Query.Trim(), ct);
        return Ok(result);
    }

    /// <summary>
    /// Owner-only: generate embeddings for all menu items that don't have one.
    /// Run once after deploying the feature, or after rotating models.
    /// </summary>
    [HttpPost("restaurants/{restaurantId:guid}/embeddings/backfill")]
    [Authorize(Roles = "Owner,Manager")]
    public async Task<IActionResult> Backfill(Guid restaurantId, CancellationToken ct)
    {
        await recommendation.BackfillEmbeddingsAsync(restaurantId, ct);
        return Ok(new { message = "Backfill complete." });
    }
}
