using Clean.Application.Abstractions;
using Clean.Application.Dtos;
using Clean.Application.Filters;
using Clean.Application.Responses;
using Clean.Domain.Entities;

namespace Clean.Application.Services;

public class TagService(ITagRepository repository) : ITagService
{
    public async Task<PagedResponse<TagGetDto>> GetAll(TagFilter filter)
    {
        var result = await repository.GetAll(filter);
        var dto = result.Tags.Select(t => new TagGetDto
        {
            Id = t.Id,
            Name = t.Name
        }).ToList();
        return new PagedResponse<TagGetDto>(dto, filter.PageNumber, filter.PageSize, result.Total, "Success");
    }

    public async Task<Response<TagGetDto>> GetById(int id)
    {
        var tag = await repository.GetById(id);
        if (tag == null) return new Response<TagGetDto>(404, "Tag not found", null);
        var dto = new TagGetDto { Id = tag.Id, Name = tag.Name };
        return new Response<TagGetDto>(200, "Success", dto);
    }

    public async Task<Response<string>> Create(TagCreateDto dto)
    {
        var model = new Tag { Name = dto.Name };
        await repository.Create(model);
        return new Response<string>(200, "Tag created");
    }

    public async Task<Response<string>> Delete(int id)
    {
        var result = await repository.Delete(id);
        if (result == -1) return new Response<string>(404, "Tag not found");
        return new Response<string>(200, "Tag deleted");
    }
}
