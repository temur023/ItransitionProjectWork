using Clean.Application.Abstractions;
using Clean.Application.Services;
using Clean.Infrastructure.Data;
using Clean.Infrastructure.Repositories;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace Clean.Infrastructure;

public static class RegisterDependencies
{
    public static IServiceCollection RegisterInfrastructureServices(this IServiceCollection services,
        IConfiguration configuration)
    {
        var connectionString = configuration.GetConnectionString("Default");
        services.AddDbContext<DataContext>(options=>
            options.UseNpgsql(connectionString));

        services.AddScoped<CustomIdGeneratorService>();

        services.AddScoped<IUserRepository, UserRepository>();
        services.AddScoped<IUserService, UserService>();

        services.AddScoped<IInvetoryRepository, InventoryRepository>();
        services.AddScoped<IInvetoryService, InventoryService>();

        services.AddScoped<IItemRepository, ItemRepository>();
        services.AddScoped<IItemService, ItemService>();

        services.AddScoped<ITagRepository, TagRepository>();
        services.AddScoped<ITagService, TagService>();

        services.AddScoped<IInventoryFieldRepository, InventoryFieldRepository>();
        services.AddScoped<IInventoryFieldService, InventoryFieldService>();

        services.AddScoped<IItemFieldValueRepository, ItemFieldValueRepository>();
        services.AddScoped<IItemFieldValueService, ItemFieldValueService>();

        services.AddScoped<IInventoryCommentRepository, InventoryCommentRepository>();
        services.AddScoped<IInventoryCommentService, InventoryCommentService>();

        services.AddScoped<IInventoryUserAccessRepository, InventoryUserAccessRepository>();
        services.AddScoped<IInventoryUserAccessService, InventoryUserAccessService>();

        services.AddScoped<IItemLikeRepository, ItemLikeRepository>();
        services.AddScoped<IItemLikeService, ItemLikeService>();

        services.AddScoped<IAuthRepository, AuthRepository>();
        services.AddScoped<IAuthService, AuthService>();

        return services;
    }
}