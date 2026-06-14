using DashTab.Application.Interfaces;
using Unleash;

namespace DashTab.Infrastructure.Services;

public sealed class UnleashFeatureFlags : IFeatureFlags, IDisposable
{
    private readonly IUnleash _unleash;

    public UnleashFeatureFlags(string apiUrl, string apiToken)
    {
        var settings = new UnleashSettings
        {
            AppName = "dashtab-api",
            UnleashApi = new Uri(apiUrl),
            CustomHttpHeaders = new Dictionary<string, string>
            {
                { "Authorization", apiToken },
            },
        };
        _unleash = new DefaultUnleash(settings);
    }

    public bool IsEnabled(string flag) => _unleash.IsEnabled(flag);

    public void Dispose() => (_unleash as IDisposable)?.Dispose();
}
