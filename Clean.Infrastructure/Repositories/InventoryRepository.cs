    using Clean.Application.Abstractions;
    using Clean.Application.Filters;
    using Clean.Domain.Entities;
    using Clean.Domain.Entities.Enums;
    using Clean.Infrastructure.Data;
    using Microsoft.EntityFrameworkCore;

    namespace Clean.Infrastructure.Repositories;

    public class InventoryRepository(DataContext context):IInvetoryRepository
    {
        public async Task<(List<Inventory> Inventories, int Total)> GetAll(InventoryFilter filter)
        {
            var query = context.Inventories
                .Include(i=>i.Tags)
                .Include(i=>i.CreatedBy)
                .Include(i=>i.UserAccesses)
                .OrderByDescending(i=>i.CreatedAt).AsNoTracking();
            if (filter.Tags != null && filter.Tags.Any())
            {
                query = query.Where(i => filter.Tags.All(ft => i.Tags.Any(t => t.Name == ft)));
            }
            var total = await query.CountAsync();
            var items = await query
                .Skip((filter.PageNumber - 1) * filter.PageSize) 
                .Take(filter.PageSize)
                .ToListAsync();
            return (items, total);
        }

        public async Task<(List<Inventory> Inventories, int Total)> GetShared(InventoryFilter filter, int id)
        {
            var query = context.Inventories
                .Include(i=>i.Tags)
                .Include(i=>i.CreatedBy)
                .Include(i=>i.UserAccesses)
                .Where(i=>i.UserAccesses.FirstOrDefault(u=>u.UserId==id)!=null)
                .OrderByDescending(i=>i.CreatedAt).AsNoTracking();
            if (filter.Tags != null && filter.Tags.Any())
            {
                query = query.Where(i => filter.Tags.All(ft => i.Tags.Any(t => t.Name == ft)));
            }
            var total = await query.CountAsync();
            var items = await query
                .Skip((filter.PageNumber - 1) * filter.PageSize) 
                .Take(filter.PageSize)
                .ToListAsync();
            return (items, total);
        }

        public async Task<List<InventoryField>> GetAggregationStatistics(int invId)
        {
            var fields = await context.InventoryFields.Where(f => f.InventoryId == invId).ToListAsync();
            return fields;
        }

        public async Task<Inventory> GetByToken(string token)
        {
            var inventory = await context.Inventories
                .Include(i => i.UserAccesses)
                .Include(i => i.CreatedBy)
                .Include(i => i.Fields)
                .Include(i => i.Tags)
                .FirstOrDefaultAsync(i => i.ApiToken == token);
            return inventory;
        }

        public async Task<Inventory> GetById(int id)
        {
            var find = await context.Inventories
                .Include(i => i.UserAccesses)
                .Include(i => i.CreatedBy)
                .Include(i => i.Fields)
                .Include(i => i.Tags)
                .FirstOrDefaultAsync(u => u.Id == id);
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