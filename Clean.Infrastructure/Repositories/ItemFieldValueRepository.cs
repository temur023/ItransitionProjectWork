using Clean.Application.Abstractions;
using Clean.Application.Filters;
using Clean.Domain.Entities;
using Clean.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace Clean.Infrastructure.Repositories;

public class ItemFieldValueRepository(DataContext context) : IItemFieldValueRepository
{
    public async Task<(List<ItemFieldValue> Values, int Total)> GetAll(ItemFieldValueFilter filter)
    {
        var query = context.ItemFieldValues.AsNoTracking();
        if (filter.ItemId.HasValue)
            query = query.Where(v => v.ItemId == filter.ItemId.Value);
        if (filter.FieldId.HasValue)
            query = query.Where(v => v.FieldId == filter.FieldId.Value);
        var total = await query.CountAsync();
        var values = await query
            .Skip((filter.PageNumber - 1) * filter.PageSize)
            .Take(filter.PageSize)
            .ToListAsync();
        return (values, total);
    }

    public async Task<ItemFieldValue> GetById(int id)
    {
        return await context.ItemFieldValues.FirstOrDefaultAsync(v => v.Id == id);
    }

    public async Task<int> Create(ItemFieldValue value)
    {
        context.ItemFieldValues.Add(value);
        await context.SaveChangesAsync();
        return value.Id;
    }

    public async Task<int> Delete(int id)
    {
        var find = await context.ItemFieldValues.FirstOrDefaultAsync(v => v.Id == id);
        if (find == null) return -1;
        context.ItemFieldValues.Remove(find);
        await context.SaveChangesAsync();
        return find.Id;
    }

    public async Task SaveChanges()
    {
        await context.SaveChangesAsync();
    }
}
