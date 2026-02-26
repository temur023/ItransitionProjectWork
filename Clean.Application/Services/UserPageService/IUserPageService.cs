using Clean.Application.Dtos;
using Clean.Application.Filters;
using Clean.Application.Responses;

namespace Clean.Application.Services.UserPageService;

public interface IUserPageService
{
    Task<PagedResponse<InventoryGetDto>> GetInvsWithAccess(InventoryFilter filter);
    Task<PagedResponse<InventoryGetDto>> GetOwnInvs(InventoryFilter filter);
}