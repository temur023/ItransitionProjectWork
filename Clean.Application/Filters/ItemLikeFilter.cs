namespace Clean.Application.Filters;

public class ItemLikeFilter
{
    public int? ItemId { get; set; }
    public int? UserId { get; set; }
    public int PageNumber { get; set; } = 1;
    public int PageSize { get; set; } = 10;
}
