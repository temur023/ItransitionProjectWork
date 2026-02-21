namespace Clean.Application.Dtos;

public class InventoryCommentCreateDto
{
    public int InventoryId { get; set; }
    public int UserId { get; set; }
    public string Content { get; set; }
}
