using Clean.Application.Dtos;
using Clean.Application.Filters;
using Clean.Application.Responses;

namespace Clean.Application.Services;

public interface IItemService
{
    Task<PagedResponse<ItemGetDto>> GetAll(ItemFilter filter);
    Task<Response<ItemGetDto>> GetById(int id);
    Task<Response<string>> Create(ItemCreateDto dto);
    Task<Response<string>> Update(ItemCreateDto dto);
    Task<Response<string>> Delete(int id);
}