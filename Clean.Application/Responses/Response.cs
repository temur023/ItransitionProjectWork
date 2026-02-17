namespace Clean.Application.Responses;

public class Response<T>
{
    public int StatusCode { get; set; }
    public string Message { get; set; } = string.Empty;
    public T? Data { get; set; }

    public Response(int statusCode, string message, T? data = default)
    {
        StatusCode = statusCode;
        Message = message;
        Data = data;
    }
    public Response(T data)
    {
        Data = data;
        StatusCode = 200;
    }
}