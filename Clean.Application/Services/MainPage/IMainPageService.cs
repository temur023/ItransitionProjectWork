using Clean.Application.Dtos;
using Clean.Application.Dtos.MainPageDto;
using Clean.Application.Responses;
using Clean.Domain.Entities;

namespace Clean.Application.Services.MainPage;

public interface IMainPageService
{
    Task<Response<List<LatestInventoriesDto>>> GetLatestInventories();
    Task<Response<List<GetTopInventoriesDto>>> GetTopInventories();
}