using Clean.Application.Abstractions;
using Clean.Application.Dtos;
using Clean.Application.Filters;
using Clean.Application.Responses;
using Clean.Domain.Entities;

namespace Clean.Application.Services;

public class InventoryFieldService(IInventoryFieldRepository repository) : IInventoryFieldService
{
    public async Task<PagedResponse<InventoryFieldGetDto>> GetAll(InventoryFieldFilter filter)
    {
        var result = await repository.GetAll(filter);
        var dto = result.Fields.Select(f => new InventoryFieldGetDto
        {
            Id = f.Id,
            InventoryId = f.InventoryId,
            Title = f.Title,
            Description = f.Description,
            Type = f.Type,
            ShowInTable = f.ShowInTable,
            Order = f.Order
        }).ToList();
        return new PagedResponse<InventoryFieldGetDto>(dto, filter.PageNumber, filter.PageSize, result.Total, "Success");
    }

    public async Task<Response<InventoryFieldGetDto>> GetById(int id)
    {
        var field = await repository.GetById(id);
        if (field == null) return new Response<InventoryFieldGetDto>(404, "Inventory field not found", null);
        var dto = new InventoryFieldGetDto
        {
            Id = field.Id,
            InventoryId = field.InventoryId,
            Title = field.Title,
            Description = field.Description,
            Type = field.Type,
            ShowInTable = field.ShowInTable,
            Order = field.Order
        };
        return new Response<InventoryFieldGetDto>(200, "Success", dto);
    }

    public async Task<Response<string>> Create(InventoryFieldCreateDto dto)
    {
        var model = new InventoryField
        {
            InventoryId = dto.InventoryId,
            Title = dto.Title,
            Description = dto.Description,
            Type = dto.Type,
            ShowInTable = dto.ShowInTable,
            Order = dto.Order
        };
        await repository.Create(model);
        return new Response<string>(200, "Inventory field created");
    }

    public async Task<Response<string>> Delete(int id)
    {
        var result = await repository.Delete(id);
        if (result == -1) return new Response<string>(404, "Inventory field not found");
        return new Response<string>(200, "Inventory field deleted");
    }
}
