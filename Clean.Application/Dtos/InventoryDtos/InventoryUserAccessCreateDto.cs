namespace Clean.Application.Dtos;

public class InventoryUserAccessCreateDto
{
    public int InventoryId { get; set; }
    public int UserId { get; set; }
    public string EmailOrUsername { get; set; }
}
