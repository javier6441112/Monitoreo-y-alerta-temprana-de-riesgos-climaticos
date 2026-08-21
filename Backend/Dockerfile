FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

COPY ["WeatherRisk.Api.csproj", "."]
RUN dotnet restore "WeatherRisk.Api.csproj"

COPY . .
RUN dotnet publish "WeatherRisk.Api.csproj" -c Release -o /app/publish --no-restore

FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS runtime
WORKDIR /app
ENV ASPNETCORE_HTTP_PORTS=8080
EXPOSE 8080

COPY --from=build /app/publish .
ENTRYPOINT ["dotnet", "WeatherRisk.Api.dll"]
