using DashTab.Application.Storage;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Minio;
using Minio.DataModel.Args;

namespace DashTab.Infrastructure.Services.Storage;

public class StorageBucketBootstrapper(IMinioClient minio, ILogger<StorageBucketBootstrapper> logger) : IHostedService
{
    private record BucketSpec(string Name, bool PublicRead);

    private static readonly BucketSpec[] Buckets =
    [
        new(StorageBuckets.MenuImages, PublicRead: true),
    ];

    private const string PublicReadPolicyTemplate = """
        {
          "Version": "2012-10-17",
          "Statement": [
            {
              "Effect": "Allow",
              "Principal": { "AWS": ["*"] },
              "Action": ["s3:GetObject"],
              "Resource": ["arn:aws:s3:::{bucket}/*"]
            }
          ]
        }
        """;

    public async Task StartAsync(CancellationToken ct)
    {
        const int maxRetries = 5;
        for (var attempt = 1; attempt <= maxRetries; attempt++)
        {
            try
            {
                await EnsureBucketsAsync(ct);
                return;
            }
            catch (Exception ex) when (attempt < maxRetries)
            {
                logger.LogWarning(ex,
                    "Storage bootstrap attempt {Attempt}/{MaxRetries} failed, retrying in {Delay}s",
                    attempt, maxRetries, attempt * 2);
                await Task.Delay(TimeSpan.FromSeconds(attempt * 2), ct);
            }
        }
    }

    public Task StopAsync(CancellationToken ct) => Task.CompletedTask;

    private async Task EnsureBucketsAsync(CancellationToken ct)
    {
        foreach (var (name, publicRead) in Buckets)
        {
            var exists = await minio.BucketExistsAsync(new BucketExistsArgs().WithBucket(name), ct);
            if (!exists)
            {
                await minio.MakeBucketAsync(new MakeBucketArgs().WithBucket(name), ct);
                logger.LogInformation("Created MinIO bucket: {Bucket}", name);
            }

            if (publicRead)
            {
                var policy = PublicReadPolicyTemplate.Replace("{bucket}", name);
                await minio.SetPolicyAsync(new SetPolicyArgs().WithBucket(name).WithPolicy(policy), ct);
                logger.LogInformation("Applied public-read policy to bucket: {Bucket}", name);
            }
        }
    }
}
