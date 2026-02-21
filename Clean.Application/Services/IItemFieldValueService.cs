using Clean.Application.Dtos;
using Clean.Application.Filters;
using Clean.Application.Responses;

namespace Clean.Application.Services;

public interface IItemFieldValueService
{
    Task<PagedResponse<ItemFieldValueGetDto>> GetAll(ItemFieldValueFilter filter);
    Task<Response<ItemFieldValueGetDto>> GetById(int id);
    Task<Response<string>> Create(ItemFieldValueCreateDto dto);
    Task<Response<string>> Delete(int id);
}
