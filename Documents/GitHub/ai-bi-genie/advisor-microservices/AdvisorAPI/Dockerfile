# Use the official .NET 8 runtime as the base image
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS base
WORKDIR /app
EXPOSE 8080
EXPOSE 8081

# Use the official .NET 8 SDK for building
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
ARG BUILD_CONFIGURATION=Release
WORKDIR /src

# Copy project files and restore dependencies
COPY ["advisor-microservices/AdvisorAPI/AdvisorAPI.csproj", "advisor-microservices/AdvisorAPI/"]
COPY ["lib/azure/Azure.Extensions.csproj", "lib/azure/"]
COPY ["lib/database/Database.Extensions.csproj", "lib/database/"]
COPY ["shared/AI.BI.Genie.Shared.csproj", "shared/"]

RUN dotnet restore "advisor-microservices/AdvisorAPI/AdvisorAPI.csproj"

# Copy the rest of the source code
COPY . .

# Build the application
WORKDIR "/src/advisor-microservices/AdvisorAPI"
RUN dotnet build "AdvisorAPI.csproj" -c $BUILD_CONFIGURATION -o /app/build

# Publish the application
FROM build AS publish
ARG BUILD_CONFIGURATION=Release
RUN dotnet publish "AdvisorAPI.csproj" -c $BUILD_CONFIGURATION -o /app/publish /p:UseAppHost=false

# Create the final image
FROM base AS final
WORKDIR /app

# Create a non-root user for security
RUN groupadd -r appgroup && useradd -r -g appgroup appuser

# Copy the published application
COPY --from=publish /app/publish .

# Set ownership and permissions
RUN chown -R appuser:appgroup /app
USER appuser

# Configure health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8080/health || exit 1

# Set environment variables
ENV ASPNETCORE_URLS=http://+:8080
ENV ASPNETCORE_ENVIRONMENT=Production

# Set the entry point
ENTRYPOINT ["dotnet", "AdvisorAPI.dll"]