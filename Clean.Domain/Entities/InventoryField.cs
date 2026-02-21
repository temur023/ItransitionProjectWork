using Clean.Domain.Entities.Enums;

namespace Clean.Domain.Entities;

public class InventoryField
{
    public int Id { get; set; }

    public int InventoryId { get; set; }
    public Inventory Inventory { get; set; }

    public string Title { get; set; }

    public string? Description { get; set; }

    public FieldType Type { get; set; }

    public bool ShowInTable { get; set; }

    public int Order { get; set; }
}