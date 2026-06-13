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
public class PublicController(IRecommendationService recommendation, IFeatureFlags features) : ControllerBase
{
    /// <summary>
    /// Customer-facing AI recommendation: takes a craving and returns
    /// semantically-matched menu items + an LLM-written blurb.
    /// Gated behind the <c>menu-recommendations</c> Unleash flag.
    /// </summary>
    [HttpPost("restaurants/{restaurantId:guid}/recommend")]
    [AllowAnonymous]
    public async Task<IActionResult> Recommend(
        Guid restaurantId,
        [FromBody] RecommendationRequest request,
        CancellationToken ct)
    {
        if (!features.IsEnabled("menu-recommendations"))
            return StatusCode(503, new { error = "AI menu recommendations are not available yet." });

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
