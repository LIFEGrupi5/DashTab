FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

COPY DashTab.sln .
COPY DashTab.API/DashTab.API.csproj DashTab.API/
COPY DashTab.Application/DashTab.Application.csproj DashTab.Application/
COPY DashTab.Domain/DashTab.Domain.csproj DashTab.Domain/
COPY DashTab.Infrastructure/DashTab.Infrastructure.csproj DashTab.Infrastructure/
RUN dotnet restore DashTab.sln

COPY . .
RUN dotnet publish DashTab.API/DashTab.API.csproj -c Release -o /app/publish --no-restore

FROM mcr.microsoft.com/dotnet/aspnet:10.0
WORKDIR /app
COPY --from=build /app/publish .
ENV ASPNETCORE_URLS=http://+:5000
EXPOSE 5000
ENTRYPOINT ["dotnet", "DashTab.API.dll"]
