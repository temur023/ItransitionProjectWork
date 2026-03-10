# 1. Use the .NET 10 SDK for building
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

# 2. Copy the solution and project files to restore dependencies
COPY ["Clean.Application/Clean.Application.csproj", "Clean.Application/"]
COPY ["Clean.Domain/Clean.Domain.csproj", "Clean.Domain/"]
COPY ["Clean.Infrastructure/Clean.Infrastructure.csproj", "Clean.Infrastructure/"]
COPY ["Clean.Web/Clean.Web.csproj", "Clean.Web/"]

RUN dotnet restore "Clean.Web/Clean.Web.csproj"

# 3. Copy the rest of the source code
COPY . .

# 4. Build and Publish
WORKDIR "/src/Clean.Web"
RUN dotnet publish "Clean.Web.csproj" -c Release -o /app/publish /p:UseAppHost=false

# 5. Use the lightweight ASP.NET runtime image for serving the app
FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS runtime
WORKDIR /app
COPY --from=build /app/publish .

# 6. Expose the port Railway expects and set ASP.NET to listen on it
EXPOSE 8080
ENV ASPNETCORE_URLS=http://+:8080

# 7. Start the application (assuming Clean.Web.dll is your main assembly)
ENTRYPOINT ["dotnet", "Clean.Web.dll"]
