namespace Clean.Application.Filters;

public class InventoryFilter
{
    public List<string>? Tags { get; set; }
    public int PageNumber { get; set; } = 1;
    public int PageSize { get; set; } = 10;
}