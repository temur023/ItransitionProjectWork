using Clean.Application.Responses;
using Clean.Domain.Entities;

namespace Clean.Application.Abstractions;

public interface IMainPageRepository
{
    Task<List<Inventory>> GetLatestInventories();
    Task<List<Inventory>> GetTopInventories();
}