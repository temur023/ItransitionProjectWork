using Microsoft.AspNetCore.SignalR;

namespace Clean.Application.Services;

public class InventoryCommentHub:Hub
{
    public async Task JoinInventoryGroup(int inventoryId)
    {
        await Groups.AddToGroupAsync(Context.ConnectionId, inventoryId.ToString());
    }
    public async Task RemoveInventoryGroup(int inventoryId)
    {
        await Groups.RemoveFromGroupAsync(Context.ConnectionId, inventoryId.ToString());
    }
}