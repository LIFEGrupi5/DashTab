using DashTab.Application.Dtos;

namespace DashTab.Application.Interfaces;

public interface IStorageService
{
    Task<PresignedUploadUrl> CreatePresignedUploadAsync(
        string bucket, string objectKey, TimeSpan expiry, string contentType, CancellationToken ct = default);

    string GetPublicUrl(string bucket, string objectKey);

    Task DeleteAsync(string bucket, string objectKey, CancellationToken ct = default);

    Task<StoredObjectInfo?> StatAsync(string bucket, string objectKey, CancellationToken ct = default);
}

public record StoredObjectInfo(long Size, string? ContentType);
