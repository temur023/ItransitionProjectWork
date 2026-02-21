using Clean.Application.Filters;
using Clean.Domain.Entities;

namespace Clean.Application.Abstractions;

public interface IInventoryFieldRepository
{
    Task<(List<InventoryField> Fields, int Total)> GetAll(InventoryFieldFilter filter);
    Task<InventoryField> GetById(int id);
    Task<int> Create(InventoryField field);
    Task<int> Delete(int id);
    Task SaveChanges();
}
