using Clean.Application.Abstractions;
using Clean.Application.Dtos;
using Clean.Application.Filters;
using Clean.Application.Responses;
using Clean.Domain.Entities;
using Clean.Domain.Entities.Enums;

namespace Clean.Application.Services;

public class InventoryFieldService(IInventoryFieldRepository repository,IInvetoryRepository invetoryRepository) : IInventoryFieldService
{
    public async Task<PagedResponse<InventoryFieldGetDto>> GetAll(InventoryFieldFilter filter, int invId)
    {
        var result = await repository.GetAll(filter, invId);
        var dto = result.Fields.Select(f => new InventoryFieldGetDto
        {
            Id = f.Id,
            InvId = f.InventoryId,
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
            InvId = field.InventoryId,
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
        var inv = await invetoryRepository.GetById(dto.InvId);
        var model = new InventoryField
        {
            InventoryId = dto.InvId,
            Title = dto.Title,
            MaxMultiLineLength =  dto.MaxMultiLineLength,
            MaxSingleLineLength = dto.MaxSingleLineLength,
            MinNumberLength = dto.MinNumberLength,
            MaxNumberLength = dto.MaxNumberLength,
            Description =   dto.Description,
            Type = dto.Type,
            ShowInTable = dto.ShowInTable,
            Order = dto.Order
        };
        await repository.Create(model);
        return new Response<string>(200, "Inventory field created");
    }

    public async Task<Response<string>> Update(InventoryFieldUpdateDto dto)
    {
        var field = await repository.GetById(dto.Id);
        if (field == null)
        {
            return new Response<string>(404, "Inventory field not found");
        }

        field.Title = dto.Title;
        field.Description = dto.Description;
        field.Type = dto.Type;
        field.ShowInTable = dto.ShowInTable;
        field.Order = dto.Order;
        field.MaxMultiLineLength = dto.MaxMultiLineLength;
        field.MaxSingleLineLength = dto.MaxSingleLineLength;
        field.MinNumberLength = dto.MinNumberLength;
        field.MaxNumberLength = dto.MaxNumberLength;

        await repository.SaveChanges();
        return new Response<string>(200, "Inventory field updated");
    }

    public async Task<Response<string>> Delete(int id)
    {
        var result = await repository.Delete(id);
        if (result == -1) return new Response<string>(404, "Inventory field not found");
        return new Response<string>(200, "Inventory field deleted");
    }
}
