using Clean.Application.Abstractions;
using Clean.Application.Filters;
using Clean.Domain;
using Clean.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace Clean.Infrastructure.Repositories;

public class ItemLikeRepository(DataContext context) : IItemLikeRepository
{
    public async Task<(List<ItemLike> Likes, int Total)> GetAll(ItemLikeFilter filter)
    {
        var query = context.ItemLikes.AsNoTracking();
        if (filter.ItemId.HasValue)
            query = query.Where(l => l.ItemId == filter.ItemId.Value);
        if (filter.UserId.HasValue)
            query = query.Where(l => l.UserId == filter.UserId.Value);
        var total = await query.CountAsync();
        var likes = await query
            .Skip((filter.PageNumber - 1) * filter.PageSize)
            .Take(filter.PageSize)
            .ToListAsync();
        return (likes, total);
    }

    public async Task<ItemLike> GetByItemAndUser(int itemId, int userId)
    {
        return await context.ItemLikes
            .FirstOrDefaultAsync(l => l.ItemId == itemId && l.UserId == userId);
    }

    public async Task Create(ItemLike like)
    {
        like.CreatedAt = DateTime.UtcNow;
        context.ItemLikes.Add(like);
        await context.SaveChangesAsync();
    }

    public async Task<bool> Delete(int itemId, int userId)
    {
        var find = await context.ItemLikes
            .FirstOrDefaultAsync(l => l.ItemId == itemId && l.UserId == userId);
        if (find == null) return false;
        context.ItemLikes.Remove(find);
        await context.SaveChangesAsync();
        return true;
    }

    public async Task SaveChanges()
    {
        await context.SaveChangesAsync();
    }
}
