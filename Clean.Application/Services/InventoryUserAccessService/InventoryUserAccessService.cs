using Clean.Application.Abstractions;
using Clean.Application.Dtos;
using Clean.Application.Filters;
using Clean.Application.Responses;
using Clean.Domain.Entities;

namespace Clean.Application.Services;

public class InventoryUserAccessService(IInventoryUserAccessRepository repository) : IInventoryUserAccessService
{
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
        var deleted = await repository.Delete(inventoryId, userId);
        if (!deleted) return new Response<string>(404, "Inventory user access not found");
        return new Response<string>(200, "Inventory user access deleted");
    }
}
