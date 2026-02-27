namespace Clean.Domain.Entities;

public class InventoryUserAccess
{
    public int InventoryId { get; set; }
    public Inventory Inventory { get; set; }
    public int UserId { get; set; }
    public User User { get; set; }
    public string Email { get; set; }
    public string UserName { get; set; }
}
