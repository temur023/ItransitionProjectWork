using System.Security.Claims;
using Clean.Application.Abstractions;
using Clean.Application.Dtos;
using Clean.Application.Filters;
using Clean.Application.Responses;
using Clean.Domain.Entities;
using Clean.Domain.Entities.Enums;
using Microsoft.AspNetCore.Http;

namespace Clean.Application.Services.InventoryService;

public class InventoryService(IInvetoryRepository repository
    , IHttpContextAccessor httpContextAccessor
    , IUserRepository userRepository):IInvetoryService
{
    private int? GetCurrentUserId() =>
        int.TryParse(httpContextAccessor.HttpContext?.User?.FindFirst(ClaimTypes.NameIdentifier)
            ?.Value, out var userId) ? userId : null;
    public async Task<PagedResponse<InventoryGetDto>> GetAll(InventoryFilter filter)
    {
        var invs = await repository.GetAll(filter);
        var dto = invs.Inventories.Select(u => new InventoryGetDto()
        {
            Id = u.Id,
            CreatedAt = u.CreatedAt.ToUniversalTime(),
            Description = u.Description,
            Category = u.Category,
            IsPublic = u.IsPublic,
            CreatedById = u.CreatedById,
            Version = u.Version,
            ImageUrl = u.ImageUrl,
            Title = u.Title,
            UserAccesses = u.UserAccesses
        });
        if (GetCurrentUserId() == null)
        {
            return new PagedResponse<InventoryGetDto>(dto.Where(i => i.IsPublic).ToList()
                ,filter.PageNumber, filter.PageSize,invs.Total,"Success");
        }
        var usr = await userRepository.GetById((int)GetCurrentUserId());

        if (usr.Role == UserRole.Admin)
        {
            return new PagedResponse<InventoryGetDto>(dto.ToList()
                , filter.PageNumber, filter.PageSize, invs.Total, "Success");
        }
        
        return new PagedResponse<InventoryGetDto>(dto.Where(i=>i.IsPublic == true 
                                                               ||i.UserAccesses.Any(i=>i.UserId==usr.Id)).ToList()
            ,filter.PageNumber, filter.PageSize,invs.Total,"Success");
    }

    public async Task<Response<InventoryGetDto>> GetById(int id)
    {
        var inv = await repository.GetById(id);
        var dto = new InventoryGetDto()
        {
            Id = inv.Id,
            CreatedAt = inv.CreatedAt.ToUniversalTime(),
            Description = inv.Description,
            Category = inv.Category,
            IsPublic =  inv.IsPublic,
            CreatedById = inv.CreatedById,
            Version = inv.Version,
            ImageUrl =  inv.ImageUrl,
            Title =  inv.Title,
        };
        if (inv.IsPublic)
        {
            return new Response<InventoryGetDto>(200, "Inventory found", dto);
        }
        var currentUserId = GetCurrentUserId();
        if(currentUserId == null)
            return new Response<InventoryGetDto>(400,"You do not have the required permission");
        var usr = await userRepository.GetById((int)currentUserId);
        if ( inv.CreatedById == currentUserId 
             ||inv.UserAccesses.Any(u => u.UserId == currentUserId)||usr.Role==UserRole.Admin)
            return new Response<InventoryGetDto>(200, "Inventory found", dto);
        
        return new Response<InventoryGetDto>(403, "You do not have the required permission");
        
    }

public async Task<Response<string>> Create(InventoryCreateDto dto)
{
    var currentUser = GetCurrentUserId();
    if (currentUser == null)
        return new Response<string>(401, "Not Authorized");

    var model = new Inventory()
    {
        CreatedAt = DateTime.UtcNow,
        Description = dto.Description,
        Category = dto.Category,
        IsPublic = dto.IsPublic,
        CreatedById = (int)currentUser,
        Version = 1,
        ImageUrl = dto.ImageUrl,
        Title = dto.Title,
    };

    await repository.Create(model);
    return new Response<string>(200, "Inventory created");
}

public async Task<Response<string>> Update(InventoryCreateDto dto)
{
    var currentUser = GetCurrentUserId();
    if (currentUser == null)
        return new Response<string>(401, "Not Authorized");

    var inv = await repository.GetById(dto.Id);


    var user = await userRepository.GetById((int)currentUser);
    if (user.Role != UserRole.Admin && inv.UserAccesses.All(i => i.UserId != currentUser))
        return new Response<string>(403, "Not Authorized");

    inv.IsPublic = dto.IsPublic;
    inv.Title = dto.Title;
    inv.Description = dto.Description;
    inv.Category = dto.Category;
    inv.ImageUrl = dto.ImageUrl;

    await repository.SaveChanges();
    return new Response<string>(200, "Updated");
}

public async Task<Response<string>> Delete(int id)
{
    var currentUser = GetCurrentUserId();
    if (currentUser == null)
        return new Response<string>(401, "Not Authorized");

    var inv = await repository.GetById(id);

    var user = await userRepository.GetById((int)currentUser);
    if (user.Role != UserRole.Admin && inv.UserAccesses.All(i => i.UserId != currentUser))
        return new Response<string>(403, "Not Authorized");

    var result = await repository.Delete(id);
    if (result == -1)
        return new Response<string>(404, "Inventory not found");

    return new Response<string>(200, "Deleted");
}
    public async Task<Response<List<string>>> GetTagSuggestions(List<string> tags)
    {
        var tgs = await repository.SelectTags(tags); 
        return new Response<List<string>>(200, "Tags retrieved", tgs);
    }
}