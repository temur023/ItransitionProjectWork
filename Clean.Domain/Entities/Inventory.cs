using Clean.Domain.Entities.Enums;
using NpgsqlTypes;

namespace Clean.Domain.Entities;

public class Inventory
{
    public int Id { get; set; }
    public NpgsqlTsVector SearchVector { get; set; }
    public string CustomIdFormatJson { get; set; } = "[]";
    public int CurrentSequence { get; set; } = 0;

    public string Title { get; set; }

    public string Description { get; set; }

    public Category Category { get; set; }

    public string? ImageUrl { get; set; }

    public bool IsPublic { get; set; }

    public int Version { get; set; }

    public int CreatedById { get; set; }
    public User CreatedBy { get; set; }
    public DateTimeOffset CreatedAt { get; set; }

    public ICollection<Tag> Tags { get; set; } = new HashSet<Tag>();

    public ICollection<InventoryField> Fields { get; set; }
    public ICollection<Item> Items { get; set; }
    public ICollection<InventoryUserAccess>  UserAccesses { get; set; }
}
