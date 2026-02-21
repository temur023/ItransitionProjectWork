namespace Clean.Application.Filters;

public class ItemFieldValueFilter
{
    public int? ItemId { get; set; }
    public int? FieldId { get; set; }
    public int PageNumber { get; set; } = 1;
    public int PageSize { get; set; } = 10;
}
