FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src
COPY Services/Sensor/Sensor.csproj Services/Sensor/
COPY Services/Platform Services/Platform/
RUN dotnet restore Services/Sensor/Sensor.csproj
COPY Services/Sensor Services/Sensor/
RUN dotnet publish Services/Sensor/Sensor.csproj -c Release -o /out --no-restore
FROM mcr.microsoft.com/dotnet/aspnet:10.0
RUN apt-get update && apt-get install -y --no-install-recommends curl && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY --from=build /out .
USER $APP_UID
EXPOSE 8080
ENTRYPOINT ["dotnet","Sensor.dll"]
