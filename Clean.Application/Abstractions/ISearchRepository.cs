using Clean.Domain.Entities;

namespace Clean.Application.Abstractions;

public interface ISearchRepository
{
    Task<List<Item>> SearchItems(string query, int? tagId = null);
    Task<List<Inventory>> SearchInventories(string query);
}