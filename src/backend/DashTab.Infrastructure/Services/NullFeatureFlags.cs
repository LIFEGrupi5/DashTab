using DashTab.Application.Interfaces;

namespace DashTab.Infrastructure.Services;

// Fail-open: used when Unleash is not configured (local dev without credentials).
public sealed class NullFeatureFlags : IFeatureFlags
{
    public bool IsEnabled(string flag) => true;
}
