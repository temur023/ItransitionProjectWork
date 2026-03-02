namespace Clean.Application.Dtos;

public class InventoryUserAccessCreateDto
{
    public int InvId { get; set; }
    public int UserId { get; set; }
    public string EmailOrUsername { get; set; }
}
