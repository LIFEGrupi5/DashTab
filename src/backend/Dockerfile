# ── Build stage ───────────────────────────────────────────────────────────────
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

COPY DashTab.API/DashTab.API.csproj DashTab.API/
COPY DashTab.Application/DashTab.Application.csproj DashTab.Application/
COPY DashTab.Domain/DashTab.Domain.csproj DashTab.Domain/
COPY DashTab.Infrastructure/DashTab.Infrastructure.csproj DashTab.Infrastructure/
RUN dotnet restore DashTab.API/DashTab.API.csproj

COPY . .
RUN dotnet publish DashTab.API/DashTab.API.csproj -c Release -o /app/publish --no-restore

# ── Runtime stage ─────────────────────────────────────────────────────────────
# Chiseled = distroless-style Ubuntu: no shell, no package manager, minimal CVE
# surface, and ships a baked-in non-root `app` user (UID 1654). The `-extra`
# variant adds ICU + tzdata so culture/time-zone-dependent code keeps working.
# Satisfies DO-2 (minimal base + non-root) and feeds DO-9 (distroless hardening).
FROM mcr.microsoft.com/dotnet/aspnet:10.0-noble-chiseled-extra
WORKDIR /app
COPY --from=build /app/publish .

# Drop to the non-root user provided by the chiseled base.
USER $APP_UID

ENV ASPNETCORE_URLS=http://+:5000
EXPOSE 5000
ENTRYPOINT ["dotnet", "DashTab.API.dll"]
