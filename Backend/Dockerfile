FROM mcr.microsoft.com/dotnet/sdk:10.0-alpine AS build
WORKDIR /src

COPY ["WeatherRisk.Api.csproj", "."]
RUN dotnet restore "WeatherRisk.Api.csproj"

COPY . .
RUN dotnet publish "WeatherRisk.Api.csproj" -c Release -o /app/publish --no-restore

FROM mcr.microsoft.com/dotnet/aspnet:10.0-alpine AS runtime
WORKDIR /app
ENV ASPNETCORE_HTTP_PORTS=8080
ENV DOTNET_SYSTEM_GLOBALIZATION_INVARIANT=false
EXPOSE 8080

RUN apk add --no-cache icu-libs

COPY --from=build /app/publish .
ENTRYPOINT ["dotnet", "WeatherRisk.Api.dll"]
