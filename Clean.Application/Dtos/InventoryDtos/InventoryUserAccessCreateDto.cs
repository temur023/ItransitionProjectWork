namespace Clean.Application.Dtos;

public class InventoryUserAccessCreateDto
{
    public int InventoryId { get; set; }
    public int UserId { get; set; }
    public bool CanWrite { get; set; }
}
