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
    , IUserRepository userRepository
    , ITagRepository tagRepository) : IInvetoryService
{
    private int? GetCurrentUserId() =>
        int.TryParse(httpContextAccessor.HttpContext?.User?.FindFirst(ClaimTypes.NameIdentifier)
            ?.Value, out var userId) ? userId : null;

    public async Task<PagedResponse<InventoryGetDto>> GetShared(InventoryFilter filter, int id)
    {
        var currentUserId = GetCurrentUserId();
        if (currentUserId == null)
        {
            return new PagedResponse<InventoryGetDto>([]
                ,filter.PageNumber, filter.PageSize,0,"You are not authorized");
        }
        var invs = await repository.GetShared(filter,id);
        var dto = invs.Inventories.Select(u => new InventoryGetDto()
        {
            Id = u.Id,
            CreatedAt = u.CreatedAt.ToUniversalTime(),
            Description = u.Description,
            Category = u.Category,
            IsPublic = u.IsPublic,
            CreatedById = u.CreatedById,
            CustomIdFormatJson = u.CustomIdFormatJson,
            CreatorName = u.CreatedBy.UserName,
            Version = u.Version,
            ImageUrl = u.ImageUrl,
            Title = u.Title,
            UserAccesses = u.UserAccesses?.Select(a => new InventoryUserAccessGetDto { 
                InvId = a.InventoryId, 
                UserId = a.UserId, 
                EmailOrUsername = a.UserName ?? a.Email 
            }).ToList() ?? new List<InventoryUserAccessGetDto>(),
            Tags = u.Tags?.Select(t => t.Name).ToList()
        }).ToList();
        return new PagedResponse<InventoryGetDto>(dto,filter.PageNumber, filter.PageSize,invs.Total,"Success");
    }

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
            CustomIdFormatJson = u.CustomIdFormatJson,
            CreatorName = u.CreatedBy.UserName,
            Version = u.Version,
            ImageUrl = u.ImageUrl,
            Title = u.Title,
            UserAccesses = u.UserAccesses?.Select(a => new InventoryUserAccessGetDto { 
                InvId = a.InventoryId, 
                UserId = a.UserId, 
                EmailOrUsername = a.UserName ?? a.Email 
            }).ToList() ?? new List<InventoryUserAccessGetDto>(),
            Tags = u.Tags?.Select(t => t.Name).ToList()
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
            CustomIdFormatJson = inv.CustomIdFormatJson,
            IsPublic = inv.IsPublic,
            CreatorName = inv.CreatedBy.UserName,
            CreatedById = inv.CreatedById,
            Version = inv.Version,
            ImageUrl = inv.ImageUrl,
            Title = inv.Title,
            UserAccesses = inv.UserAccesses?.Select(a => new InventoryUserAccessGetDto { 
                InvId = a.InventoryId, 
                UserId = a.UserId, 
                EmailOrUsername = a.UserName ?? a.Email 
            }).ToList() ?? new List<InventoryUserAccessGetDto>(),
            Tags = inv.Tags?.Select(t => t.Name).ToList()
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

public async Task<Response<InventoryGetDto>> Create(InventoryCreateDto dto)
{
    var currentUser = GetCurrentUserId();
    if (currentUser == null)
        return new Response<InventoryGetDto>(401, "Not Authorized");

    var model = new Inventory()
    {
        CreatedAt = DateTime.UtcNow,
        Description = dto.Description,
        Category = dto.Category,
        IsPublic = dto.IsPublic,
        CustomIdFormatJson = dto.CustomIdFormatJson,
        CreatedById = (int)currentUser,
        Version = 1,
        ImageUrl = dto.ImageUrl,
        Title = dto.Title,
    };
    if (dto.Tags != null && dto.Tags.Count > 0)
    {
        foreach (var name in dto.Tags.Where(n => !string.IsNullOrWhiteSpace(n)))
        {
            var tag = await tagRepository.GetByName(name.Trim());
            if (tag == null)
            {
                tag = new Tag { Name = name.Trim() };
                tagRepository.Add(tag);
            }
            model.Tags.Add(tag);
        }
    }
    await repository.Create(model);
    var creator = await userRepository.GetById((int)currentUser);
    var inv = new InventoryGetDto()
    {
        Id = model.Id,
        CreatedAt = model.CreatedAt,
        Description = model.Description,
        Category = model.Category,
        IsPublic = model.IsPublic,
        CustomIdFormatJson = model.CustomIdFormatJson,
        CreatorName = creator?.UserName,
        CreatedById = model.CreatedById,
        Version = model.Version,
        ImageUrl = model.ImageUrl,
        Title = model.Title,
        Tags = model.Tags?.Select(t => t.Name).ToList()
    };
    return new Response<InventoryGetDto>(200, "Inventory created", inv);
}

public async Task<Response<string>> Update(InventoryUpdateDto dto)
{
    var currentUser = GetCurrentUserId();
    if (currentUser == null)
        return new Response<string>(401, "Unauthorized");

    var inventory = await repository.GetById(dto.Id);
    if (inventory == null)
        return new Response<string>(404, "Inventory not found");

    var user = await userRepository.GetById((int)currentUser);
    if (inventory.CreatedById != currentUser && user.Role != UserRole.Admin)
        return new Response<string>(403, "Forbidden");

    inventory.Title = dto.Title;
    inventory.Description = dto.Description;
    inventory.Category = dto.Category;
    inventory.IsPublic = dto.IsPublic;

    inventory.Tags.Clear();
    if (dto.Tags != null && dto.Tags.Count > 0)
    {
        foreach (var name in dto.Tags.Where(n => !string.IsNullOrWhiteSpace(n)))
        {
            var tag = await tagRepository.GetByName(name.Trim());
            if (tag == null)
            {
                tag = new Tag { Name = name.Trim() };
                tagRepository.Add(tag);
            }
            inventory.Tags.Add(tag);
        }
    }

    await repository.SaveChanges();
    return new Response<string>(200, "Inventory updated");
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