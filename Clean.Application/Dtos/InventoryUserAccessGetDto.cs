namespace Clean.Application.Dtos;

public class InventoryUserAccessGetDto
{
    public int InventoryId { get; set; }
    public int UserId { get; set; }
    public bool CanWrite { get; set; }
}
