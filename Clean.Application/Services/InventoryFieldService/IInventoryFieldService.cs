using Clean.Application.Dtos;
using Clean.Application.Filters;
using Clean.Application.Responses;

namespace Clean.Application.Services;

public interface IInventoryFieldService
{
    Task<PagedResponse<InventoryFieldGetDto>> GetAll(InventoryFieldFilter filter);
    Task<Response<InventoryFieldGetDto>> GetById(int id);
    Task<Response<string>> Create(InventoryFieldCreateDto dto);
    Task<Response<string>> Delete(int id);
}
