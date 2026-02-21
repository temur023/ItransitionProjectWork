using Clean.Application.Abstractions;
using Clean.Application.Dtos;
using Clean.Application.Filters;
using Clean.Application.Responses;
using Clean.Domain.Entities;

namespace Clean.Application.Services;

public class InventoryService(IInvetoryRepository repository):IInvetoryService
{
    public async Task<PagedResponse<InventoryGetDto>> GetAll(InventoryFilter filter)
    {
        var invs = await repository.GetAll(filter);
        var dto = invs.Inventories.Select(u=>new InventoryGetDto()
        {
            Id = u.Id,
            Description = u.Description,
            Category = u.Category,
            Tags = u.Tags.Select(t => t.Name).ToList()
        }).ToList();
        return new PagedResponse<InventoryGetDto>(dto,filter.PageNumber, filter.PageSize,invs.Total,"Success");
    }

    public async Task<Response<InventoryGetDto>> GetById(int id)
    {
        var inv = await repository.GetById(id);
        var dto = new InventoryGetDto()
        {
            Id = inv.Id,
            Description = inv.Description,
            Category = inv.Category
        };
        return new Response<InventoryGetDto>(200, "Inventory found", dto);
    }

    public async Task<Response<string>> Create(InventoryCreateDto dto)
    {
        
        var model = new Inventory()
        {
            Description = dto.Description,
            Category = dto.Category,
            Tags = dto.Tags
        };
        var inv = await repository.Create(model);
        return new Response<string>(200, "Inventory created");
    }
    public async Task<Response<string>> Delete(int id)
    {
        var inv = await repository.Delete(id);
        if(inv == -1) return new Response<string>(404,"not found");
        return new Response<string>(200, "deleted");
    }
    public async Task<Response<List<string>>> GetTagSuggestions(List<string> tags)
    {
        var tgs = await repository.SelectTags(tags); 
        return new Response<List<string>>(200, "Tags retrieved", tgs);
    }
}