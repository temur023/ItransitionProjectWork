using Clean.Application.Dtos;
using Clean.Application.Filters;
using Clean.Application.Responses;

namespace Clean.Application.Services;

public interface IInventoryCommentService
{
    Task<PagedResponse<InventoryCommentGetDto>> GetAll(InventoryCommentFilter filter);
    Task<Response<InventoryCommentGetDto>> GetById(int id);
    Task<Response<string>> Create(InventoryCommentCreateDto dto);
    Task<Response<string>> Delete(int id);
}
