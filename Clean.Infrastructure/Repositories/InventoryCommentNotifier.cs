using Clean.Application.Dtos;
using Clean.Application.Services;
using Microsoft.AspNetCore.SignalR;

namespace Clean.Infrastructure.Repositories;

public class InventoryCommentNotifier(IHubContext<InventoryCommentHub> hubContext):IInventoryCommentNotifier
{
    public async Task NotifyCommentCreated(int inventoryId, InventoryCommentGetDto comment)
    {
        await hubContext.Clients
            .Group($"inventory-{inventoryId}")
            .SendAsync("CommentCreated", comment);
    }

    public async Task NotifyCommentDeleted(int inventoryId, int commentId)
    {
        await hubContext.Clients
            .Group($"inventory-{inventoryId}")
            .SendAsync("CommentDeleted", commentId);
    }
}