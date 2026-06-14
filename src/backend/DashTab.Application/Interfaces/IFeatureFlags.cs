namespace DashTab.Application.Interfaces;

public interface IFeatureFlags
{
    bool IsEnabled(string flag);
}
