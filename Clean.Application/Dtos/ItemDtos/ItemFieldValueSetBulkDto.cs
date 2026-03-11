using System.Collections.Generic;

namespace Clean.Application.Dtos;

public class ItemFieldValueSetBulkDto
{
    public int ItemId { get; set; }
    public List<FieldValueDto> FieldValues { get; set; }
}

public class FieldValueDto
{
    public int FieldId { get; set; }
    public string Value { get; set; }
}
