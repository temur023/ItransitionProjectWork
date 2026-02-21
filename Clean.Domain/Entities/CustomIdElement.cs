using Clean.Domain.Entities.Enums;

namespace Clean.Domain.Entities;

public class CustomIdElement
{
    public IdElementType Type { get; set; }
    public string? Value { get; set; }
    public string? Format { get; set; }
}