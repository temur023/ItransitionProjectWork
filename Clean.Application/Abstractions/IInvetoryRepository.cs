using Clean.Application.Filters;
using Clean.Domain.Entities;

namespace Clean.Application.Abstractions;

public interface IInvetoryRepository
{
    Task<(List<Inventory> Inventories, int Total)> GetAll(InventoryFilter filter);
    Task<(List<Inventory> Inventories, int Total)> GetShared(InventoryFilter filter, int id);
    Task<List<InventoryField>> GetAggregationStatistics(int invId);
    Task<Inventory> GetByToken(string token);
    Task<Inventory> GetById(int id);
    Task<int> Create(Inventory inventory);
    Task<int> Delete(int id);
    Task<List<string>> SelectTags(List<string> tags);
    Task SaveChanges();
}