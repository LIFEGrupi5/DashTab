namespace DashTab.Application.Dtos;

public record ForecastPointDto(
    string Date,
    string Day,
    decimal Predicted,
    decimal Lower,
    decimal Upper);

public record RevenueForecastResponse(
    IEnumerable<ForecastPointDto> Forecast,
    string? Message);
