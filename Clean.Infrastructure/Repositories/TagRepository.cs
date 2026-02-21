using Clean.Application.Abstractions;
using Clean.Application.Filters;
using Clean.Domain.Entities;
using Clean.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace Clean.Infrastructure.Repositories;

public class TagRepository(DataContext context) : ITagRepository
{
    public async Task<(List<Tag> Tags, int Total)> GetAll(TagFilter filter)
    {
        var query = context.Tags.AsNoTracking();
        var total = await query.CountAsync();
        var tags = await query
            .Skip((filter.PageNumber - 1) * filter.PageSize)
            .Take(filter.PageSize)
            .ToListAsync();
        return (tags, total);
    }

    public async Task<Tag> GetById(int id)
    {
        return await context.Tags.FirstOrDefaultAsync(t => t.Id == id);
    }

    public async Task<int> Create(Tag tag)
    {
        context.Tags.Add(tag);
        await context.SaveChangesAsync();
        return tag.Id;
    }

    public async Task<int> Delete(int id)
    {
        var find = await context.Tags.FirstOrDefaultAsync(t => t.Id == id);
        if (find == null) return -1;
        context.Tags.Remove(find);
        await context.SaveChangesAsync();
        return find.Id;
    }

    public async Task SaveChanges()
    {
        await context.SaveChangesAsync();
    }
}
