using Clean.Application.Dtos;
using Clean.Application.Filters;
using Clean.Application.Responses;

namespace Clean.Application.Services;

public interface ITagService
{
    Task<PagedResponse<TagGetDto>> GetAll(TagFilter filter);
    Task<Response<TagGetDto>> GetById(int id);
    Task<Response<string>> Create(TagCreateDto dto);
    Task<Response<string>> Delete(int id);
}
