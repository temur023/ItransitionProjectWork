using Clean.Application.Abstractions;
using Clean.Application.Dtos;
using Clean.Application.Filters;
using Clean.Application.Responses;
using Clean.Domain.Entities;

namespace Clean.Application.Services;

public class ItemFieldValueService(IItemFieldValueRepository repository) : IItemFieldValueService
{
    public async Task<PagedResponse<ItemFieldValueGetDto>> GetAll(ItemFieldValueFilter filter)
    {
        var result = await repository.GetAll(filter);
        var dto = result.Values.Select(v => new ItemFieldValueGetDto
        {
            Id = v.Id,
            ItemId = v.ItemId,
            FieldId = v.FieldId,
            ValueText = v.ValueText,
            ValueNumber = v.ValueNumber,
            ValueBool = v.ValueBool,
            ValueLink = v.ValueLink
        }).ToList();
        return new PagedResponse<ItemFieldValueGetDto>(dto, filter.PageNumber, filter.PageSize, result.Total, "Success");
    }

    public async Task<Response<ItemFieldValueGetDto>> GetById(int id)
    {
        var value = await repository.GetById(id);
        if (value == null) return new Response<ItemFieldValueGetDto>(404, "Item field value not found", null);
        var dto = new ItemFieldValueGetDto
        {
            Id = value.Id,
            ItemId = value.ItemId,
            FieldId = value.FieldId,
            ValueText = value.ValueText,
            ValueNumber = value.ValueNumber,
            ValueBool = value.ValueBool,
            ValueLink = value.ValueLink
        };
        return new Response<ItemFieldValueGetDto>(200, "Success", dto);
    }

    public async Task<Response<string>> Create(ItemFieldValueCreateDto dto)
    {
        var model = new ItemFieldValue
        {
            ItemId = dto.ItemId,
            FieldId = dto.FieldId,
            ValueText = dto.ValueText,
            ValueNumber = dto.ValueNumber,
            ValueBool = dto.ValueBool,
            ValueLink = dto.ValueLink
        };
        await repository.Create(model);
        return new Response<string>(200, "Item field value created");
    }

    public async Task<Response<string>> Delete(int id)
    {
        var result = await repository.Delete(id);
        if (result == -1) return new Response<string>(404, "Item field value not found");
        return new Response<string>(200, "Item field value deleted");
    }
}
