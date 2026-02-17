namespace Clean.Domain.Entities;

public class Tag
{
    public int Id { get; set; }
    public string Name { get; set; }
    public ICollection<Inventory> Inventories { get; set; } = new HashSet<Inventory>();
}