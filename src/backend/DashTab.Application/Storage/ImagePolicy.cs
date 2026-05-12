namespace DashTab.Application.Storage;

public static class ImagePolicy
{
    public const long MaxBytes = 5 * 1024 * 1024;

    public static readonly IReadOnlyDictionary<string, string> AllowedExtensions =
        new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
        {
            ["png"] = "image/png",
            ["jpg"] = "image/jpeg",
            ["jpeg"] = "image/jpeg",
            ["webp"] = "image/webp",
        };

    public static string? ResolveContentType(string? fileExtension)
    {
        if (string.IsNullOrWhiteSpace(fileExtension)) return null;
        var ext = fileExtension.TrimStart('.');
        return AllowedExtensions.TryGetValue(ext, out var ct) ? ct : null;
    }
}
