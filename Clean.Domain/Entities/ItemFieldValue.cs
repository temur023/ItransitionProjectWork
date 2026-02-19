namespace Clean.Domain.Entities;

public class ItemFieldValue
{
    public int Id { get; set; }

    public int ItemId { get; set; }
    public Item Item { get; set; }

    public int FieldId { get; set; }
    public InventoryField Field { get; set; }

    public string? ValueText { get; set; }

    public decimal? ValueNumber { get; set; }

    public bool? ValueBool { get; set; }

    public string? ValueLink { get; set; }
}