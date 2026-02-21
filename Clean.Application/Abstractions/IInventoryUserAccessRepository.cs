using Clean.Application.Filters;
using Clean.Domain.Entities;

namespace Clean.Application.Abstractions;

public interface IInventoryUserAccessRepository
{
    Task<(List<InventoryUserAccess> AccessList, int Total)> GetAll(InventoryUserAccessFilter filter);
    Task<InventoryUserAccess> GetByInventoryAndUser(int inventoryId, int userId);
    Task Create(InventoryUserAccess access);
    Task<bool> Delete(int inventoryId, int userId);
    Task SaveChanges();
}
