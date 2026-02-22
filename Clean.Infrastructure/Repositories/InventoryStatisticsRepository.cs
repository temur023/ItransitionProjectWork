using Clean.Application.Abstractions;
using Clean.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace Clean.Infrastructure.Repositories;

public class InventoryStatisticsRepository(DataContext context):IInventoryStatisticsRepository
{
    public async Task<int> NumberOfItems(int id)
    {
        var inv = await context.Inventories
            .Include(i=>i.Items)
            .FirstOrDefaultAsync(i => i.Id == id);
        if (inv == null) return -1;
        return inv.Items.Count;
    }
    
}