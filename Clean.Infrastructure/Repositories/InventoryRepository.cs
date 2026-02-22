    using Clean.Application.Abstractions;
    using Clean.Application.Filters;
    using Clean.Domain.Entities;
    using Clean.Infrastructure.Data;
    using Microsoft.EntityFrameworkCore;

    namespace Clean.Infrastructure.Repositories;

    public class InventoryRepository(DataContext context):IInvetoryRepository
    {
        public async Task<(List<Inventory> Inventories, int Total)> GetAll(InventoryFilter filter)
        {
            var query = context.Inventories.Include(i=>i.Tags).AsNoTracking();
            if (filter.Tags != null && filter.Tags.Any())
            {
                query = query.Where(i => i.Tags.Any(t => filter.Tags.Contains(t.Name)));
            }
            var total = await query.CountAsync();
            var items = await query
                .Skip((filter.PageNumber - 1) * filter.PageSize) 
                .Take(filter.PageSize)
                .OrderBy(i=>i.CreatedAt)
                .ToListAsync();
            return (items, total);
        }

        public async Task<Inventory> GetById(int id)
        {
            var find = await context.Inventories.FirstOrDefaultAsync(u=>u.Id == id);
            var check = await context.InventoryUserAccesses.FirstOrDefaultAsync(u=>u.InventoryId == id);
            return find;
        }

        public async Task<int> Create(Inventory inventory)
        {
            context.Inventories.Add(inventory);
            await context.SaveChangesAsync();
            return inventory.Id;
        }

        public async Task<int> Delete(int id)
        {
            var find = await context.Inventories.FirstOrDefaultAsync(u=>u.Id == id);
            if (find == null) return -1;
            context.Inventories.Remove(find);
            await context.SaveChangesAsync();
            return find.Id;
        }

        public async Task<List<string>> SelectTags(List<string> tags)
        {
            var query = await context.Tags
                .Where(t=>tags.Any(prefix=>t.Name.Contains(prefix)))
                .Take(10)
                .Select(t=>t.Name)
                .ToListAsync();
            return query;
        }

        public async Task SaveChanges()
        {
            await context.SaveChangesAsync();
        }
    }