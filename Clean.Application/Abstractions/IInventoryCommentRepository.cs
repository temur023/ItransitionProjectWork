using Clean.Application.Filters;
using Clean.Domain.Entities;

namespace Clean.Application.Abstractions;

public interface IInventoryCommentRepository
{
    Task<(List<InventoryComment> Comments, int Total)> GetAll(InventoryCommentFilter filter);
    Task<InventoryComment> GetById(int id);
    Task<int> Create(InventoryComment comment);
    Task<int> Delete(int id);
    Task SaveChanges();
}
