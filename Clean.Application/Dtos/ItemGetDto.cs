namespace Clean.Application.Dtos;

public class ItemGetDto
{
    public int Id { get; set; }

    public int InventoryId { get; set; }

    public string CustomId { get; set; }

    public int CreatedById { get; set; }

    public int UpdatedById { get; set; }

    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }

    public int Version { get; set; }
}