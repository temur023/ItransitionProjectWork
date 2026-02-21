using Clean.Application.Abstractions;
using Clean.Application.Filters;
using Clean.Domain.Entities;
using Clean.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace Clean.Infrastructure.Repositories;

public class InventoryFieldRepository(DataContext context) : IInventoryFieldRepository
{
    public async Task<(List<InventoryField> Fields, int Total)> GetAll(InventoryFieldFilter filter)
    {
        var query = context.InventoryFields.AsNoTracking();
        if (filter.InventoryId.HasValue)
            query = query.Where(f => f.InventoryId == filter.InventoryId.Value);
        var total = await query.CountAsync();
        var fields = await query
            .Skip((filter.PageNumber - 1) * filter.PageSize)
            .Take(filter.PageSize)
            .ToListAsync();
        return (fields, total);
    }

    public async Task<InventoryField> GetById(int id)
    {
        return await context.InventoryFields.FirstOrDefaultAsync(f => f.Id == id);
    }

    public async Task<int> Create(InventoryField field)
    {
        context.InventoryFields.Add(field);
        await context.SaveChangesAsync();
        return field.Id;
    }

    public async Task<int> Delete(int id)
    {
        var find = await context.InventoryFields.FirstOrDefaultAsync(f => f.Id == id);
        if (find == null) return -1;
        context.InventoryFields.Remove(find);
        await context.SaveChangesAsync();
        return find.Id;
    }

    public async Task SaveChanges()
    {
        await context.SaveChangesAsync();
    }
}
