using Clean.Application.Abstractions;
using Clean.Application.Responses;
using Clean.Domain.Entities;
using Clean.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace Clean.Infrastructure.Repositories;

public class MainPageRepository(DataContext context):IMainPageRepository
{
    public async Task<List<Inventory>> GetLatestInventories()
    {
        var invs = await context.Inventories.Include(i=>i.CreatedBy)
            .OrderByDescending(i => i.CreatedAt)
            .Take(5).ToListAsync();
        return invs;
    }

    public async Task<List<Inventory>> GetTopInventories()
    {
        var invs = await context.Inventories
            .Include(i => i.Items)
            .OrderByDescending(i => i.Items.Count)
            .Take(5)
            .ToListAsync();
        return invs;
    }
}