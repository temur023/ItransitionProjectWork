using Clean.Application.Dtos;
using Clean.Application.Filters;
using Clean.Application.Responses;

namespace Clean.Application.Services;

public interface IInventoryUserAccessService
{
    Task<PagedResponse<InventoryUserAccessGetDto>> GetAll(InventoryUserAccessFilter filter);
    Task<Response<InventoryUserAccessGetDto>> GetByInventoryAndUser(int inventoryId, int userId);
    Task<Response<string>> Create(InventoryUserAccessCreateDto dto);
    Task<Response<string>> Delete(int inventoryId, int userId);
}
