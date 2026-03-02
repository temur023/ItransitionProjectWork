namespace Clean.Application.Dtos;

/// <summary>
/// Used when returning an item with its custom field values for display (single string per field).
/// </summary>
public class ItemFieldValueDisplayDto
{
    public int FieldId { get; set; }
    public string? Value { get; set; }
}
