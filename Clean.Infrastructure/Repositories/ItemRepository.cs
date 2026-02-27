using Clean.Application.Abstractions;
using Clean.Application.Filters;
using Clean.Domain.Entities;
using Clean.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace Clean.Infrastructure.Repositories;

public class ItemRepository(DataContext context):IItemRepository
{
    public async Task<(List<Item> Items, int Total)> GetAll(ItemFilter filter, int InvId)
    {
        var query = context.Items
            .Include(i => i.CreatedBy)
            .Include(i => i.UpdatedBy)
            .Where(i=>i.InventoryId == InvId).AsNoTracking();
        var total = await query.CountAsync();
        var items = await query
            .Skip((filter.PageNumber - 1) * filter.PageSize) 
            .Take(filter.PageSize)
            .OrderByDescending(i => i.CreatedAt)
            .ToListAsync();
        return (items, total);
    }

    public async Task<Item> GetById(int id)
    {
        var find = await context.Items.FirstOrDefaultAsync(u=>u.Id == id);
        return find;
    }

    public async Task<(int ItemId, string FinalCustomId)> Create(Item item, Func<int, string> idGenerator)
    {
        var inventory = await context.Inventories.FindAsync(item.InventoryId);
        if (inventory == null) throw new Exception("Inventory not found");
        inventory.CurrentSequence++;
        item.CustomId = idGenerator(inventory.CurrentSequence);
        context.Items.Add(item);
        await context.SaveChangesAsync();
        return (item.Id, item.CustomId);
    }

    public async Task<int> Delete(int id)
    {
        var find = await context.Items.FirstOrDefaultAsync(u=>u.Id == id);
        if (find == null) return -1;
        context.Items.Remove(find);
        await context.SaveChangesAsync();
        return find.Id;
    }

    public async Task SaveChanges()
    {
        await context.SaveChangesAsync();
    }
}