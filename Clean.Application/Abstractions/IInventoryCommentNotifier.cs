using Clean.Application.Dtos;

namespace Clean.Application.Services;

public interface IInventoryCommentNotifier
{
    Task NotifyCommentCreated(int inventoryId, InventoryCommentGetDto comment);
    Task NotifyCommentDeleted(int inventoryId, int commentId);
}