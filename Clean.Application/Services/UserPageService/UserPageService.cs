using System.Security.Claims;
using Clean.Application.Abstractions;
using Clean.Application.Dtos;
using Clean.Application.Filters;
using Clean.Application.Responses;
using Microsoft.AspNetCore.Http;

namespace Clean.Application.Services.UserPageService;

public class UserPageService(IUserPageRepository repository
    , IHttpContextAccessor httpContextAccessor):IUserPageService
{
    private int? GetCurrentUserId() =>
        int.TryParse(httpContextAccessor.HttpContext?.User?.FindFirst(ClaimTypes.NameIdentifier)
            ?.Value, out var userId) ? userId : null;
    public async Task<PagedResponse<InventoryGetDto>> GetInvsWithAccess(InventoryFilter filter)
    {
        var currentUserId = GetCurrentUserId();
        var invs = await repository.GetAllWithAccess((int)currentUserId, filter);
        var dto = invs.invs.Select(u => new InventoryGetDto()
        {
            Id = u.Id,
            CreatedAt = u.CreatedAt.ToUniversalTime(),
            Description = u.Description,
            Category = u.Category,
            IsPublic = u.IsPublic,
            CreatedById = u.CreatedById,
            CreatorName = u.CreatedBy.UserName,
            Version = u.Version,
            ImageUrl = u.ImageUrl,
            Title = u.Title,
            UserAccesses = u.UserAccesses
        }).ToList();
        return new PagedResponse<InventoryGetDto>(dto,filter.PageNumber, filter.PageSize,invs.Total, "Success");
    }

    public async Task<PagedResponse<InventoryGetDto>> GetOwnInvs(InventoryFilter filter)
    {
        var currentUserId = GetCurrentUserId();
        var invs = await repository.GetAllOwn((int)currentUserId, filter);
        var dto = invs.invs.Select(u => new InventoryGetDto()
        {
            Id = u.Id,
            CreatedAt = u.CreatedAt.ToUniversalTime(),
            Description = u.Description,
            Category = u.Category,
            IsPublic = u.IsPublic,
            CreatedById = u.CreatedById,
            CreatorName = u.CreatedBy.UserName,
            Version = u.Version,
            ImageUrl = u.ImageUrl,
            Title = u.Title,
            UserAccesses = u.UserAccesses
        }).ToList();
        return new PagedResponse<InventoryGetDto>(dto,filter.PageNumber, filter.PageSize,invs.Total, "Success");
    }

    public async Task<Response<string>> DeleteSelected(List<int> selectedIds)
    {
        var currentUserId = GetCurrentUserId();
        var invs = await repository.DeleteSelected((int)currentUserId , selectedIds);
        return new Response<string>(200,"Deleted Successfully");
    }
}