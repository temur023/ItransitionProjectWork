namespace Clean.Application.Dtos;

public class ItemFieldValueCreateDto
{
    public int ItemId { get; set; }
    public int FieldId { get; set; }
    public string? ValueText { get; set; }
    public decimal? ValueNumber { get; set; }
    public bool? ValueBool { get; set; }
    public string? ValueLink { get; set; }
}
