using System.Net.Http.Json;
using System.Text;
using System.Text.Json;
using DashTab.Application.Dtos;
using DashTab.Application.Interfaces;
using DashTab.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Pgvector;
using Pgvector.EntityFrameworkCore;

namespace DashTab.Infrastructure.Services;

public class RecommendationService(
    DashTabDbContext db,
    IHttpClientFactory httpFactory,
    IConfiguration config,
    ILogger<RecommendationService> logger) : IRecommendationService
{
    private static readonly JsonSerializerOptions JsonOpts = new() { PropertyNameCaseInsensitive = true };

    // ── Public API ────────────────────────────────────────────────────────────

    public async Task<RecommendationResponse> RecommendAsync(
        Guid restaurantId, string query, CancellationToken ct = default)
    {
        // 1. Embed the customer's craving.
        var queryVector = await EmbedTextAsync(query, ct);

        // 2a. No vector (key missing / call failed) → return top 4 available items as fallback.
        if (queryVector is null)
        {
            var fallback = await db.MenuItems
                .IgnoreQueryFilters()
                .Where(m => m.RestaurantId == restaurantId && m.IsAvailable && !m.IsDeleted)
                .OrderBy(m => m.Name)
                .Take(4)
                .Select(m => new RecommendedItemDto(m.Name, m.Description, m.Price, m.ImageObjectKey))
                .ToListAsync(ct);

            return new RecommendationResponse(
                "AI recommendations are warming up. Here are some items from our menu:",
                fallback);
        }

        // 2b. Cosine similarity search — explicitly scoped to this restaurant's menu.
        // IgnoreQueryFilters because CurrentTenantId is null for anonymous requests.
        // Take top 3 closest — the LLM decides which to actually recommend from those.
        // With rich menu descriptions, irrelevant items naturally rank much lower.
        var matches = await db.MenuItems
            .IgnoreQueryFilters()
            .Where(m => m.RestaurantId == restaurantId
                        && m.IsAvailable
                        && !m.IsDeleted
                        && m.Embedding != null)
            .OrderBy(m => m.Embedding!.CosineDistance(queryVector))
            .Take(3)
            .Select(m => new RecommendedItemDto(m.Name, m.Description, m.Price, m.ImageObjectKey))
            .ToListAsync(ct);

        // If no items have embeddings yet, fall back to the full available menu.
        if (matches.Count == 0)
        {
            var noEmbeddingFallback = await db.MenuItems
                .IgnoreQueryFilters()
                .Where(m => m.RestaurantId == restaurantId && m.IsAvailable && !m.IsDeleted)
                .OrderBy(m => m.Name)
                .Take(4)
                .Select(m => new RecommendedItemDto(m.Name, m.Description, m.Price, m.ImageObjectKey))
                .ToListAsync(ct);

            return new RecommendationResponse(
                "Here are some items from our menu — semantic search will be ready shortly.",
                noEmbeddingFallback);
        }

        // 3. Ask the LLM to write a friendly recommendation from the matched items.
        var blurb = await GenerateBlurbAsync(query, matches, ct);

        return new RecommendationResponse(blurb, matches);
    }

    public async Task BackfillEmbeddingsAsync(Guid restaurantId, CancellationToken ct = default)
    {
        var items = await db.MenuItems
            .IgnoreQueryFilters()
            .Where(m => m.RestaurantId == restaurantId && !m.IsDeleted && m.Embedding == null)
            .ToListAsync(ct);

        logger.LogInformation("Backfilling embeddings for {Count} items in restaurant {Id}", items.Count, restaurantId);

        foreach (var item in items)
        {
            var text = BuildEmbeddingText(item.Name, item.Description);
            var vector = await EmbedTextAsync(text, ct);
            if (vector is not null)
            {
                item.Embedding = vector;
                await db.SaveChangesAsync(ct);
            }
        }
    }

    public async Task EmbedItemAsync(Guid menuItemId, CancellationToken ct = default)
    {
        var item = await db.MenuItems.IgnoreQueryFilters().FirstOrDefaultAsync(m => m.Id == menuItemId, ct);
        if (item is null) return;

        var text = BuildEmbeddingText(item.Name, item.Description);
        var vector = await EmbedTextAsync(text, ct);
        if (vector is not null)
        {
            item.Embedding = vector;
            await db.SaveChangesAsync(ct);
        }
    }

    // ── OpenAI calls (both fail-soft — never throw to callers) ────────────────

    private async Task<Vector?> EmbedTextAsync(string text, CancellationToken ct)
    {
        var apiKey = config["OpenAI:ApiKey"];
        if (string.IsNullOrWhiteSpace(apiKey))
        {
            logger.LogDebug("OpenAI:ApiKey not configured — skipping embedding");
            return null;
        }

        try
        {
            var client = CreateClient(apiKey);
            var body = new { model = config["OpenAI:EmbeddingModel"] ?? "text-embedding-3-small", input = text };
            var resp = await client.PostAsJsonAsync(
                $"{config["OpenAI:BaseUrl"] ?? "https://api.openai.com/v1"}/embeddings", body, ct);

            if (!resp.IsSuccessStatusCode)
            {
                logger.LogWarning("OpenAI embeddings returned {Status}", resp.StatusCode);
                return null;
            }

            var result = await resp.Content.ReadFromJsonAsync<EmbeddingResponse>(JsonOpts, ct);
            var floats = result?.Data?.FirstOrDefault()?.Embedding;
            return floats is null ? null : new Vector(floats);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Failed to call OpenAI embeddings");
            return null;
        }
    }

    private async Task<string?> GenerateBlurbAsync(
        string query, IEnumerable<RecommendedItemDto> items, CancellationToken ct)
    {
        var apiKey = config["OpenAI:ApiKey"];
        if (string.IsNullOrWhiteSpace(apiKey)) return null;

        try
        {
            var itemList = string.Join("\n", items.Select(i =>
                $"- {i.Name}: {i.Description} (€{i.Price:F2})"));

            var messages = new[]
            {
                new { role = "system", content =
                    "You are a friendly, knowledgeable waiter. The customer has told you their craving. " +
                    "Recommend only the dishes from the list that GENUINELY match the craving — it is fine to recommend just 1 dish. " +
                    "If none match well, honestly say so and suggest the closest option. " +
                    "Be warm and specific — mention the dish name. Keep it under 80 words. Never invent dishes." },
                new { role = "user", content =
                    $"The customer says: \"{query}\"\n\nAvailable dishes:\n{itemList}" },
            };

            var client = CreateClient(apiKey);
            var body = new
            {
                model = config["OpenAI:ChatModel"] ?? "gpt-4o-mini",
                messages,
                max_tokens = 150,
                temperature = 0.7,
            };

            var resp = await client.PostAsJsonAsync(
                $"{config["OpenAI:BaseUrl"] ?? "https://api.openai.com/v1"}/chat/completions", body, ct);

            if (!resp.IsSuccessStatusCode)
            {
                logger.LogWarning("OpenAI chat returned {Status}", resp.StatusCode);
                return null;
            }

            var result = await resp.Content.ReadFromJsonAsync<ChatResponse>(JsonOpts, ct);
            return result?.Choices?.FirstOrDefault()?.Message?.Content?.Trim();
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Failed to call OpenAI chat");
            return null;
        }
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private HttpClient CreateClient(string apiKey)
    {
        var client = httpFactory.CreateClient();
        client.Timeout = TimeSpan.FromSeconds(15);
        client.DefaultRequestHeaders.Add("Authorization", $"Bearer {apiKey}");
        return client;
    }

    private static string BuildEmbeddingText(string name, string description) =>
        string.IsNullOrWhiteSpace(description) ? name : $"{name}. {description}";

    // ── OpenAI response shapes (minimal, only what we need) ──────────────────

    private record EmbeddingResponse(List<EmbeddingData>? Data);
    private record EmbeddingData(float[] Embedding);
    private record ChatResponse(List<ChatChoice>? Choices);
    private record ChatChoice(ChatMessage? Message);
    private record ChatMessage(string? Content);
}
