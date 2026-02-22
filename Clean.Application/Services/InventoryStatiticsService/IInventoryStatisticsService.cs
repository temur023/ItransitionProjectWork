using Clean.Application.Responses;

namespace Clean.Application.Services.InventoryStatiticsService;

public interface IInventoryStatisticsService
{
    Task<Response<int>> NumberOfItems(int id);
}