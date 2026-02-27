using Clean.Application.Abstractions;
using Clean.Application.Filters;
using Clean.Domain.Entities;
using Clean.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace Clean.Infrastructure.Repositories;

public class InventoryUserAccessRepository(DataContext context) : IInventoryUserAccessRepository
{
    public async Task<(List<InventoryUserAccess> AccessList, int Total)> GetAll(InventoryUserAccessFilter filter)
    {
        var query = context.InventoryUserAccesses.AsNoTracking();
        if (filter.InventoryId.HasValue)
            query = query.Where(a => a.InventoryId == filter.InventoryId.Value);
        if (filter.UserId.HasValue)
            query = query.Where(a => a.UserId == filter.UserId.Value);
        var total = await query.CountAsync();
        var list = await query
            .Skip((filter.PageNumber - 1) * filter.PageSize)
            .Take(filter.PageSize)
            .ToListAsync();
        return (list, total);
    }

    public async Task<InventoryUserAccess> GetByInventoryAndUser(int inventoryId, int userId)
    {
        return await context.InventoryUserAccesses
            .FirstOrDefaultAsync(a => a.InventoryId == inventoryId && a.UserId == userId);
    }

    public async Task Create(InventoryUserAccess access)
    {
        context.InventoryUserAccesses.Add(access);
        await context.SaveChangesAsync();
    }

    public async Task<bool> Exists(int inventoryId, int userId)
    {
        var exists = await context.InventoryUserAccesses
            .AnyAsync(a => a.InventoryId == inventoryId && a.UserId == userId);
        if (exists == true)
        {
            return true;
        }
        return false;
    }


    public async Task<bool> Delete(int inventoryId, int userId)
    {
        var find = await context.InventoryUserAccesses
            .FirstOrDefaultAsync(a => a.InventoryId == inventoryId && a.UserId == userId);
        if (find == null) return false;
        context.InventoryUserAccesses.Remove(find);
        await context.SaveChangesAsync();
        return true;
    }

    public async Task SaveChanges()
    {
        await context.SaveChangesAsync();
    }
}
