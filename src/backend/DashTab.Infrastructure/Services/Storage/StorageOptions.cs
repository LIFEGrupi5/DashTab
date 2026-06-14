namespace DashTab.Infrastructure.Services.Storage;

public class StorageOptions
{
    // Server-side endpoint (may be internal Docker hostname, e.g. http://minio:9000)
    public string Endpoint { get; set; } = string.Empty;

    // Browser-reachable base URL used in presigned URLs and public links (e.g. http://localhost:9000)
    public string PublicBaseUrl { get; set; } = string.Empty;

    public string AccessKey { get; set; } = string.Empty;
    public string SecretKey { get; set; } = string.Empty;
    public bool UseSsl { get; set; } = false;
}
