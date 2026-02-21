using Clean.Application.Abstractions;
using Clean.Application.Filters;
using Clean.Domain.Entities;
using Clean.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace Clean.Infrastructure.Repositories;

public class InventoryCommentRepository(DataContext context) : IInventoryCommentRepository
{
    public async Task<(List<InventoryComment> Comments, int Total)> GetAll(InventoryCommentFilter filter)
    {
        var query = context.InventoryComments.AsNoTracking();
        if (filter.InventoryId.HasValue)
            query = query.Where(c => c.InventoryId == filter.InventoryId.Value);
        if (filter.UserId.HasValue)
            query = query.Where(c => c.UserId == filter.UserId.Value);
        var total = await query.CountAsync();
        var comments = await query
            .Skip((filter.PageNumber - 1) * filter.PageSize)
            .Take(filter.PageSize)
            .ToListAsync();
        return (comments, total);
    }

    public async Task<InventoryComment> GetById(int id)
    {
        return await context.InventoryComments.FirstOrDefaultAsync(c => c.Id == id);
    }

    public async Task<int> Create(InventoryComment comment)
    {
        comment.CreatedAt = DateTime.UtcNow;
        context.InventoryComments.Add(comment);
        await context.SaveChangesAsync();
        return comment.Id;
    }

    public async Task<int> Delete(int id)
    {
        var find = await context.InventoryComments.FirstOrDefaultAsync(c => c.Id == id);
        if (find == null) return -1;
        context.InventoryComments.Remove(find);
        await context.SaveChangesAsync();
        return find.Id;
    }

    public async Task SaveChanges()
    {
        await context.SaveChangesAsync();
    }
}
