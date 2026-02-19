namespace Clean.Domain.Entities;

public class InventoryUserAccess
{
    public int InventoryId { get; set; }
    public Inventory Inventory { get; set; }

    public int UserId { get; set; }
    public User User { get; set; }

    public bool CanWrite { get; set; }
}
