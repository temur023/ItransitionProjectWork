namespace Clean.Application.Filters;

public class InventoryFieldFilter
{
    public int? InventoryId { get; set; }
    public int PageNumber { get; set; } = 1;
    public int PageSize { get; set; } = 10;
}
