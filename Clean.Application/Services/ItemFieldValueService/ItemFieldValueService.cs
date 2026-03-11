using System.ComponentModel.DataAnnotations;
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
        var field = await fieldRepository.GetById(dto.FieldId);
        if (field == null) return new Response<string>(404, "Field not found");

        var validationResponse = ValidateValue(field, dto.ValueNumber, dto.ValueText);
        if (validationResponse != null) return validationResponse;

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
        return await SetBulk(new ItemFieldValueSetBulkDto
        {
            ItemId = dto.ItemId,
            FieldValues = new List<FieldValueDto> { new FieldValueDto { FieldId = dto.FieldId, Value = dto.Value } }
        });
    }

    public async Task<Response<string>> SetBulk(ItemFieldValueSetBulkDto dto)
    {
        if (dto.FieldValues == null || dto.FieldValues.Count == 0)
            return new Response<string>(400, "No field values provided", null);

        foreach (var fv in dto.FieldValues)
        {
            var field = await fieldRepository.GetById(fv.FieldId);
            if (field == null) continue;

            // Validation
            decimal? valNum = null;
            if (field.Type == FieldType.Number && decimal.TryParse(fv.Value, System.Globalization.NumberStyles.Any, System.Globalization.CultureInfo.InvariantCulture, out var n))
                valNum = n;
            
            var validationResponse = ValidateValue(field, valNum, fv.Value);
            if (validationResponse != null) return validationResponse;

            var existing = await repository.GetByItemAndField(dto.ItemId, fv.FieldId);
            if (existing != null)
            {
                SetValueByType(existing, field.Type, fv.Value);
            }
            else
            {
                var model = new ItemFieldValue
                {
                    ItemId = dto.ItemId,
                    FieldId = fv.FieldId
                };
                SetValueByType(model, field.Type, fv.Value);
                await repository.Create(model);
            }
        }
        await repository.SaveChanges();
        return new Response<string>(200, "Item field values updated");
    }

    private static Response<string>? ValidateValue(InventoryField field, decimal? valueNumber, string? valueText)
    {
        if (!string.IsNullOrEmpty(valueText))
        {
            if (valueText.Contains('\n'))
            {
                if (field.MaxMultiLineLength.HasValue && valueText.Length > field.MaxMultiLineLength)
                    return new Response<string>(400, $"Multiline text in field '{field.Title}' cannot exceed {field.MaxMultiLineLength} characters!");
            }
            else if (field.MaxSingleLineLength.HasValue && valueText.Length > field.MaxSingleLineLength)
            {
                // Only validate single line length if it's NOT a number (numbers have different constraints)
                if (field.Type != FieldType.Number && valueText.Length > field.MaxSingleLineLength)
                    return new Response<string>(400, $"Single line text in field '{field.Title}' cannot exceed {field.MaxSingleLineLength} characters!");
            }
        }

        if (valueNumber.HasValue)
        {
            if (field.MaxNumberLength.HasValue && valueNumber > field.MaxNumberLength)
                return new Response<string>(400, $"The value of number field '{field.Title}' could not be larger than {field.MaxNumberLength}!");
            
            if (field.MinNumberLength.HasValue && valueNumber < field.MinNumberLength)
                return new Response<string>(400, $"The value of number field '{field.Title}' could not be less than {field.MinNumberLength}!");
        }

        return null;
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
