namespace DashTab.Domain.Enums;

public enum Plan { Basic, Pro, Enterprise }

public static class PlanLimits
{
    // Maximum number of (non-deleted) staff a restaurant on each plan may have.
    public static int MaxStaff(Plan plan) => plan switch
    {
        Plan.Basic      => 10,
        Plan.Pro        => 25,
        Plan.Enterprise => 100,
        _               => 0,
    };
}
