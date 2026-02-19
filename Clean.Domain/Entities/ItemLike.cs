using Clean.Domain.Entities;

namespace Clean.Domain;

public class ItemLike
{
    public int ItemId { get; set; }
    public Item Item { get; set; }

    public int UserId { get; set; }
    public User User { get; set; }

    public DateTime CreatedAt { get; set; }
}