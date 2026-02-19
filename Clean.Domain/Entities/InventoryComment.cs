namespace Clean.Domain.Entities;

public class InventoryComment
{
    public int Id { get; set; }

    public int InventoryId { get; set; }
    public Inventory Inventory { get; set; }

    public int UserId { get; set; }
    public User User { get; set; }

    public string Content { get; set; }

    public DateTime CreatedAt { get; set; }
}