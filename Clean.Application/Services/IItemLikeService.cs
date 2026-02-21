using Clean.Application.Dtos;
using Clean.Application.Filters;
using Clean.Application.Responses;

namespace Clean.Application.Services;

public interface IItemLikeService
{
    Task<PagedResponse<ItemLikeGetDto>> GetAll(ItemLikeFilter filter);
    Task<Response<ItemLikeGetDto>> GetByItemAndUser(int itemId, int userId);
    Task<Response<string>> Create(ItemLikeCreateDto dto);
    Task<Response<string>> Delete(int itemId, int userId);
}
