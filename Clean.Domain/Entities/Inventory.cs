using Clean.Domain.Entities.Enums;

namespace Clean.Domain.Entities;

public class Inventory
{
    public int Id { get; set; }
    public string Description { get; set; }
    public Category Category { get; set; }
    public ICollection<Tag> Tags { get; set; } = new HashSet<Tag>();
}