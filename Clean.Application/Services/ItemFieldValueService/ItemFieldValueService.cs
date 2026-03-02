using Clean.Application.Abstractions;
using Clean.Application.Dtos;
using Clean.Application.Filters;
using Clean.Application.Responses;
using Clean.Domain.Entities;
using Clean.Domain.Entities.Enums;

namespace Clean.Application.Services;

public class ItemFieldValueService(IItemFieldValueRepository repository, IInventoryFieldRepository fieldRepository) : IItemFieldValueService
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

    public async Task<Response<string>> Set(ItemFieldValueSetDto dto)
    {
        if (string.IsNullOrEmpty(dto.Value))
            return new Response<string>(400, "Value is required", null);

        var field = await fieldRepository.GetById(dto.FieldId);
        if (field == null)
            return new Response<string>(404, "Field not found", null);

        var existing = await repository.GetByItemAndField(dto.ItemId, dto.FieldId);
        if (existing != null)
        {
            SetValueByType(existing, field.Type, dto.Value);
            await repository.SaveChanges();
            return new Response<string>(200, "Item field value updated");
        }

        var model = new ItemFieldValue
        {
            ItemId = dto.ItemId,
            FieldId = dto.FieldId
        };
        SetValueByType(model, field.Type, dto.Value);
        await repository.Create(model);
        return new Response<string>(200, "Item field value set");
    }

    private static void SetValueByType(ItemFieldValue entity, FieldType fieldType, string value)
    {
        entity.ValueText = null;
        entity.ValueNumber = null;
        entity.ValueBool = null;
        entity.ValueLink = null;
        switch (fieldType)
        {
            case FieldType.SingleLineText:
            case FieldType.MultiLineText:
                entity.ValueText = value;
                break;
            case FieldType.Number:
                entity.ValueNumber = decimal.TryParse(value, System.Globalization.NumberStyles.Any, System.Globalization.CultureInfo.InvariantCulture, out var n) ? n : null;
                break;
            case FieldType.Boolean:
                entity.ValueBool = value is "true" or "1" or "yes" or "on";
                break;
            case FieldType.Link:
                entity.ValueLink = value;
                break;
            default:
                entity.ValueText = value;
                break;
        }
    }

    public async Task<Response<string>> Delete(int id)
    {
        var result = await repository.Delete(id);
        if (result == -1) return new Response<string>(404, "Item field value not found");
        return new Response<string>(200, "Item field value deleted");
    }
}
