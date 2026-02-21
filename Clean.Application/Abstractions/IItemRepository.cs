using Clean.Application.Filters;
using Clean.Domain.Entities;

namespace Clean.Application.Abstractions;

public interface IItemRepository
{
    Task<(List<Item> Items, int Total)> GetAll(ItemFilter filter);
    Task<Item> GetById(int id);
    Task<(int ItemId, string FinalCustomId)> Create(Item item, Func<int, string> idGenerator);
    Task<int> Delete(int id);
    Task SaveChanges();
}