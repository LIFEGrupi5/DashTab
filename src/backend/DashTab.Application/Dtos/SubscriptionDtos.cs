namespace DashTab.Application.Dtos;

public record CreateCheckoutRequest(string Plan);

public record CreateCheckoutResponse(string Url);

public record ConfirmCheckoutRequest(string SessionId);

public record SubscriptionDto(
    string Plan,
    string Status,
    bool IsActive,
    DateTime? CurrentPeriodEnd,
    int StaffUsed,
    int StaffLimit);
