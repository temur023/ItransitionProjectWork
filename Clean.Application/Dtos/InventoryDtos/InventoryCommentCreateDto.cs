namespace Clean.Application.Dtos;

public class InventoryCommentCreateDto
{
    public int InvId { get; set; }
    public int UserId { get; set; }
    public string Content { get; set; }
}
