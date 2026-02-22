namespace Clean.Application.Abstractions;

public interface IInventoryStatisticsRepository
{
    Task<int> NumberOfItems(int id);
}