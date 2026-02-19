using Clean.Domain.Entities.Enums;

namespace Clean.Domain.Entities;

public class Inventory
{
    public int Id { get; set; }

    public string Title { get; set; }

    public string Description { get; set; }

    public Category Category { get; set; }

    public string? ImageUrl { get; set; }

    public bool IsPublic { get; set; }

    public int Version { get; set; }

    public int CreatedById { get; set; }
    public User CreatedBy { get; set; }

    public ICollection<Tag> Tags { get; set; } = new HashSet<Tag>();

    public ICollection<InventoryField> Fields { get; set; }
    public ICollection<Item> Items { get; set; }
}
