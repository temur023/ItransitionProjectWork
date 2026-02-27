using Clean.Application.Abstractions;
using Clean.Application.Filters;
using Clean.Domain.Entities;
using Clean.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace Clean.Infrastructure.Repositories;

public class UserPageRepository(DataContext context):IUserPageRepository
{
    public async Task<(List<Inventory> invs, int Total)> GetAllWithAccess(int userId, InventoryFilter filter)
    {
        var query = context.Inventories
            .Include(i => i.UserAccesses)
            .Where(i => i.UserAccesses.Any(a => a.UserId == userId))
            .AsNoTracking();
        var total = await query.CountAsync();
        var invs = await query
            .OrderByDescending(i=>i.CreatedAt)
            .Skip((filter.PageNumber - 1) * filter.PageSize) 
            .Take(filter.PageSize)
            .ToListAsync();
        return (invs, total);
    }

    public async Task<(List<Inventory> invs, int Total)> GetAllOwn(int userId, InventoryFilter filter)
    {
        var query = context.Inventories
            .Include(i => i.UserAccesses)
            .Include(i => i.CreatedBy)
            .Where(i => i.CreatedById == userId).AsNoTracking();
        var total = await query.CountAsync();
        var invs = await query
            .OrderByDescending(i=>i.CreatedAt)
            .Skip((filter.PageNumber - 1) * filter.PageSize) 
            .Take(filter.PageSize)
            .ToListAsync();
        return (invs, total);
    }

    public async Task<List<Inventory>> DeleteSelected(int userId, List<int> invIds)
    {
        var invs = await context.Inventories
            .Where(i => i.CreatedById == userId && invIds.Contains(i.Id)).ToListAsync();
        context.Inventories.RemoveRange(invs);
        await context.SaveChangesAsync();
        return invs;
    }
}