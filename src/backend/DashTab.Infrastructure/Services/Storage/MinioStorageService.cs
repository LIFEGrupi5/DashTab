using DashTab.Application.Dtos;
using DashTab.Application.Interfaces;
using Microsoft.Extensions.Options;
using Minio;
using Minio.DataModel.Args;
using Minio.Exceptions;

namespace DashTab.Infrastructure.Services.Storage;

public class MinioStorageService : IStorageService
{
    private readonly IMinioClient _minio;
    private readonly string _publicBaseUrl;
    private readonly string _internalBaseUrl;

    public MinioStorageService(IMinioClient minio, IOptions<StorageOptions> opts)
    {
        _minio = minio;
        _publicBaseUrl = opts.Value.PublicBaseUrl.TrimEnd('/');

        // Used to rewrite internal Docker hostnames in presigned URLs to the public URL
        var endpoint = opts.Value.Endpoint;
        _internalBaseUrl = (endpoint.StartsWith("http://", StringComparison.OrdinalIgnoreCase) ||
                            endpoint.StartsWith("https://", StringComparison.OrdinalIgnoreCase))
            ? endpoint.TrimEnd('/')
            : $"http://{endpoint.TrimEnd('/')}";
    }

    public async Task<PresignedUploadUrl> CreatePresignedUploadAsync(
        string bucket, string objectKey, TimeSpan expiry, string contentType, CancellationToken ct = default)
    {
        // Binding Content-Type into the signed headers forces the client to send the exact
        // same Content-Type when uploading — otherwise MinIO rejects the PUT.
        var args = new PresignedPutObjectArgs()
            .WithBucket(bucket)
            .WithObject(objectKey)
            .WithExpiry((int)expiry.TotalSeconds)
            .WithHeaders(new Dictionary<string, string>
            {
                ["Content-Type"] = contentType
            });

        var url = await _minio.PresignedPutObjectAsync(args);

        // Swap the internal endpoint (e.g. http://minio:9000) for the browser-reachable URL
        if (!string.IsNullOrEmpty(_publicBaseUrl) && _internalBaseUrl != _publicBaseUrl)
            url = url.Replace(_internalBaseUrl, _publicBaseUrl, StringComparison.OrdinalIgnoreCase);

        return new PresignedUploadUrl(url, objectKey, contentType, DateTimeOffset.UtcNow.Add(expiry));
    }

    public string GetPublicUrl(string bucket, string objectKey)
        => $"{_publicBaseUrl}/{bucket}/{objectKey}";

    public async Task DeleteAsync(string bucket, string objectKey, CancellationToken ct = default)
    {
        var args = new RemoveObjectArgs()
            .WithBucket(bucket)
            .WithObject(objectKey);
        await _minio.RemoveObjectAsync(args, ct);
    }

    public async Task<StoredObjectInfo?> StatAsync(string bucket, string objectKey, CancellationToken ct = default)
    {
        try
        {
            var args = new StatObjectArgs()
                .WithBucket(bucket)
                .WithObject(objectKey);
            var stat = await _minio.StatObjectAsync(args, ct);
            return new StoredObjectInfo(stat.Size, stat.ContentType);
        }
        catch (ObjectNotFoundException)
        {
            return null;
        }
    }
}
