using System.Security.Claims;
using Clean.Application.Abstractions;
using Clean.Application.Dtos;
using Clean.Application.Filters;
using Clean.Application.Responses;
using Clean.Domain.Entities;
using Clean.Domain.Entities.Enums;
using Microsoft.AspNetCore.Http;

namespace Clean.Application.Services;

public class InventoryUserAccessService(IInventoryUserAccessRepository repository
    , IUserRepository userRepository, IHttpContextAccessor httpContextAccessor, IInvetoryRepository invetoryRepository) : IInventoryUserAccessService
{
    private int? GetCurrentUserId() =>
        int.TryParse(httpContextAccessor.HttpContext?.User?.FindFirst(ClaimTypes.NameIdentifier)
            ?.Value, out var userId) ? userId : null;
    public async Task<PagedResponse<InventoryUserAccessGetDto>> GetAll(InventoryUserAccessFilter filter)
    {
        var result = await repository.GetAll(filter);
        var dto = result.AccessList.Select(a => new InventoryUserAccessGetDto
        {
            InventoryId = a.InventoryId,
            UserId = a.UserId,
            CanWrite = a.CanWrite
        }).ToList();
        return new PagedResponse<InventoryUserAccessGetDto>(dto, filter.PageNumber, filter.PageSize, result.Total, "Success");
    }

    public async Task<Response<InventoryUserAccessGetDto>> GetByInventoryAndUser(int inventoryId, int userId)
    {
        var access = await repository.GetByInventoryAndUser(inventoryId, userId);
        if (access == null) return new Response<InventoryUserAccessGetDto>(404, "Inventory user access not found", null);
        var dto = new InventoryUserAccessGetDto
        {
            InventoryId = access.InventoryId,
            UserId = access.UserId,
            CanWrite = access.CanWrite
        };
        return new Response<InventoryUserAccessGetDto>(200, "Success", dto);
    }

    public async Task<Response<string>> Create(InventoryUserAccessCreateDto dto)
    {
        var currentUserId = GetCurrentUserId();
        var inv = await invetoryRepository.GetById(dto.InventoryId);
        
        if (currentUserId == null)
        {
            return new Response<string>(403, "Not Authorized");
        }
        var usr = await userRepository.GetById((int)currentUserId);
        if (usr.Role != UserRole.Admin && inv.CreatedById != currentUserId)
        {
            return new Response<string>(403,"Not Authorized");
        }
        var model = new InventoryUserAccess
        {
            InventoryId = dto.InventoryId,
            UserId = dto.UserId,
            CanWrite = dto.CanWrite
        };
        await repository.Create(model);
        return new Response<string>(200, "Inventory user access created");
    }

    public async Task<Response<string>> Delete(int inventoryId, int userId)
    {
        var currentUserId = GetCurrentUserId();
        var inv = await invetoryRepository.GetById(inventoryId);
        
        if (currentUserId == null)
        {
            return new Response<string>(403, "Not Authorized");
        }
        var usr = await userRepository.GetById((int)currentUserId);
        if (usr.Role != UserRole.Admin && inv.CreatedById != currentUserId)
        {
            return new Response<string>(403,"Not Authorized");
        }
        
        var deleted = await repository.Delete(inventoryId, userId);
        if (!deleted) return new Response<string>(404, "Inventory user access not found");
        return new Response<string>(200, "Inventory user access deleted");
    }
}
