using Clean.Application.Filters;
using Clean.Domain.Entities;

namespace Clean.Application.Abstractions;

public interface IUserPageRepository
{
    Task<(List<Inventory> invs, int Total)> GetAllWithAccess(int userId, InventoryFilter filter);
    Task<(List<Inventory> invs, int Total)> GetAllOwn(int userId, InventoryFilter filter);
}