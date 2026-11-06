FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src
COPY Services/Community/Community.csproj Services/Community/
COPY Services/Platform Services/Platform/
RUN dotnet restore Services/Community/Community.csproj
COPY Services/Community Services/Community/
RUN dotnet publish Services/Community/Community.csproj -c Release -o /out --no-restore
FROM mcr.microsoft.com/dotnet/aspnet:10.0
RUN apt-get update && apt-get install -y --no-install-recommends curl && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY --from=build /out .
USER $APP_UID
EXPOSE 8080
ENTRYPOINT ["dotnet","Community.dll"]
