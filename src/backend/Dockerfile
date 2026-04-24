FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src
COPY DashTab.API/DashTab.API.csproj DashTab.API/
RUN dotnet restore DashTab.API/DashTab.API.csproj
COPY . .
RUN dotnet publish DashTab.API/DashTab.API.csproj -c Release -o /app/publish --no-restore

FROM mcr.microsoft.com/dotnet/aspnet:10.0
WORKDIR /app
COPY --from=build /app/publish .
ENV ASPNETCORE_URLS=http://+:5000
EXPOSE 5000
ENTRYPOINT ["dotnet", "DashTab.API.dll"]
