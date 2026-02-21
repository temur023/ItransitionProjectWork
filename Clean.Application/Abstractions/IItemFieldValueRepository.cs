using Clean.Application.Filters;
using Clean.Domain.Entities;

namespace Clean.Application.Abstractions;

public interface IItemFieldValueRepository
{
    Task<(List<ItemFieldValue> Values, int Total)> GetAll(ItemFieldValueFilter filter);
    Task<ItemFieldValue> GetById(int id);
    Task<int> Create(ItemFieldValue value);
    Task<int> Delete(int id);
    Task SaveChanges();
}
