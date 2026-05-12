namespace DashTab.Application.Dtos;

public record PresignedUploadUrl(string Url, string ObjectKey, string ContentType, DateTimeOffset ExpiresAt);
