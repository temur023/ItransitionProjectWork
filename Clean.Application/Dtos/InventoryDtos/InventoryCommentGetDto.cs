namespace Clean.Application.Dtos;

public class InventoryCommentGetDto
{
    public int Id { get; set; }
    public int InventoryId { get; set; }
    public int UserId { get; set; }
    public string Content { get; set; }
    public DateTime CreatedAt { get; set; }
}
