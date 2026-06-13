using DashTab.Application.Dtos;

namespace DashTab.Application.Interfaces;

public interface IRecommendationService
{
    /// <summary>
    /// Embeds the customer's craving, runs a cosine-similarity search against
    /// the restaurant's menu, then asks the LLM to write a friendly recommendation.
    /// Falls back gracefully when the OpenAI key is missing or the call fails.
    /// </summary>
    Task<RecommendationResponse> RecommendAsync(Guid restaurantId, string query, CancellationToken ct = default);

    /// <summary>
    /// Generates and stores embeddings for menu items that don't have one yet.
    /// Called on item create/update (single item) or via the owner backfill endpoint (all items).
    /// </summary>
    Task BackfillEmbeddingsAsync(Guid restaurantId, CancellationToken ct = default);

    /// <summary>
    /// Generates and stores the embedding for a single menu item.
    /// Best-effort — never throws; logs on failure.
    /// </summary>
    Task EmbedItemAsync(Guid menuItemId, CancellationToken ct = default);
}
