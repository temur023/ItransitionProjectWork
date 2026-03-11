using Clean.Domain.Entities.Enums;

namespace Clean.Application.Dtos;

public class InventoryFieldUpdateDto
{
    public int Id { get; set; }
    public string Title { get; set; }
    public string Description { get; set; }
    public int? MaxSingleLineLength { get; set; }
    public int? MaxMultiLineLength { get; set; }
    public int? MinNumberLength { get; set; }
    public int? MaxNumberLength { get; set; }
    public FieldType Type { get; set; }
    public bool ShowInTable { get; set; }
    public int Order { get; set; }
}
