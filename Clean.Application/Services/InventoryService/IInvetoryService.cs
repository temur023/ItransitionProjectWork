using Clean.Application.Dtos;
using Clean.Application.Filters;
using Clean.Application.Responses;

namespace Clean.Application.Services;

public interface IInvetoryService
{
    Task<PagedResponse<InventoryGetDto>> GetShared(InventoryFilter filter, int id);
    Task<PagedResponse<InventoryGetDto>> GetAll(InventoryFilter filter);
    Task<Response<InventoryGetDto>> GetById(int id);
    Task<Response<InventoryGetDto>> Create(InventoryCreateDto dto);
    Task<Response<string>> Update(InventoryUpdateDto dto);
    Task<Response<string>> Delete(int id);
    Task<Response<List<string>>> GetTagSuggestions(List<string> tags);
}