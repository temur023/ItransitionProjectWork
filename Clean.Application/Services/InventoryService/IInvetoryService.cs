using Clean.Application.Dtos;
using Clean.Application.Filters;
using Clean.Application.Responses;

namespace Clean.Application.Services;

public interface IInvetoryService
{
    Task<PagedResponse<InventoryGetDto>> GetAll(InventoryFilter filter);
    Task<Response<InventoryGetDto>> GetById(int id);
    Task<Response<string>> Create(InventoryCreateDto dto);
    Task<Response<string>> Update(InventoryCreateDto dto);
    Task<Response<string>> Delete(int id);
    Task<Response<List<string>>> GetTagSuggestions(List<string> tags);
}