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
        var inv = await fieldRepository.GetById(dto.FieldId);
        
        var model = new ItemFieldValue
        {
            ItemId = dto.ItemId,
            FieldId = dto.FieldId,
            ValueText = dto.ValueText,
            ValueNumber = dto.ValueNumber,
            ValueBool = dto.ValueBool,
            ValueLink = dto.ValueLink
        };
        if (!string.IsNullOrEmpty(model.ValueText))
        {
            if (model.ValueText.Contains('\n'))
            {
                if (inv.MaxMultiLineLength.HasValue && model.ValueText.Length > inv.MaxMultiLineLength)
                    return new Response<string>(400, $"Multiline text cannot exceed {inv.MaxMultiLineLength} characters!");
            }
            else if (inv.MaxSingleLineLength.HasValue && model.ValueText.Length > inv.MaxSingleLineLength)
                    return new Response<string>(400, $"Single line text cannot exceed {inv.MaxSingleLineLength} characters!");
        }

        if (model.ValueNumber.HasValue && inv.MaxNumberLength.HasValue && model.ValueNumber>inv.MaxNumberLength)
        {
            return new Response<string>(400, $"The length of number could not be larger than {inv.MaxNumberLength}!");
        }
        if (model.ValueNumber.HasValue && inv.MinNumberLength.HasValue && model.ValueNumber<inv.MinNumberLength)
        {
            return new Response<string>(400, $"The length of number could not be less than {inv.MinNumberLength}!");
        }
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
