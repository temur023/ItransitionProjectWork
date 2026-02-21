using Clean.Application.Filters;
using Clean.Domain;

namespace Clean.Application.Abstractions;

public interface IItemLikeRepository
{
    Task<(List<ItemLike> Likes, int Total)> GetAll(ItemLikeFilter filter);
    Task<ItemLike> GetByItemAndUser(int itemId, int userId);
    Task Create(ItemLike like);
    Task<bool> Delete(int itemId, int userId);
    Task SaveChanges();
}
