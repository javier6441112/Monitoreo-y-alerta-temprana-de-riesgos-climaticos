FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src
COPY Gateway/Gateway.csproj Gateway/
COPY Services/Platform Services/Platform/
RUN dotnet restore Gateway/Gateway.csproj
COPY Gateway Gateway/
RUN dotnet publish Gateway/Gateway.csproj -c Release -o /out --no-restore
FROM mcr.microsoft.com/dotnet/aspnet:10.0
RUN apt-get update && apt-get install -y --no-install-recommends curl && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY --from=build /out .
USER $APP_UID
EXPOSE 8080
ENTRYPOINT ["dotnet","Gateway.dll"]
