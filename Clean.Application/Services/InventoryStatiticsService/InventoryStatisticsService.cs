using Clean.Application.Abstractions;
using Clean.Application.Responses;

namespace Clean.Application.Services.InventoryStatiticsService;

public class InventoryStatisticsService(IInventoryStatisticsRepository repository):IInventoryStatisticsService
{
    public async Task<Response<int>> NumberOfItems(int id)
    {
        var inv = await repository.NumberOfItems(id);
        if (inv == -1) return new Response<int>(404, "inventory not found!");
        return new Response<int>(inv,"inventory found!");
    }
}