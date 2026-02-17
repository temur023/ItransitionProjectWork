namespace Clean.Application.Responses;

public class PagedResponse<T> : Response<List<T>>
{
    public int PageNumber { get; set; }
    public int PageSize { get; set; }
    public int TotalRecords { get; set; }

    public PagedResponse(List<T> data, int pageNumber, int pageSize, int totalRecords, string message = "Success")
        : base(200, message, data)
    {
        PageNumber = pageNumber;
        PageSize = pageSize;
        TotalRecords = totalRecords;
    }
}