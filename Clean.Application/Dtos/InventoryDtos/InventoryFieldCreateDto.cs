using Clean.Domain.Entities.Enums;

namespace Clean.Application.Dtos;

public class InventoryFieldCreateDto
{
    public int InventoryId { get; set; }
    public string Title { get; set; }
    public string? Description { get; set; }
    public FieldType Type { get; set; }
    public bool ShowInTable { get; set; }
    public int Order { get; set; }
}
