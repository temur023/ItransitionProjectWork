using Clean.Application.Abstractions;
using Clean.Application.Dtos.MainPageDto;
using Clean.Application.Responses;

namespace Clean.Application.Services.MainPage;

public class MainPageService(IMainPageRepository repository):IMainPageService
{
    public async Task<Response<List<LatestInventoriesDto>>> GetLatestInventories()
    {
        var invs = await repository.GetLatestInventories();
        var dto = invs.Select(i=>new LatestInventoriesDto()
        {
            Creator = i.CreatedBy.UserName,
            Name = i.Title,
            Description =  i.Description
        }).ToList();
        return new Response<List<LatestInventoriesDto>>(200,"Success",dto);
    }

    public async Task<Response<List<GetTopInventoriesDto>>> GetTopInventories()
    {
        var invs = await repository.GetTopInventories();
        var dto = invs.Select(i=>new GetTopInventoriesDto()
        {
            Creator = i.CreatedBy.UserName,
            Name = i.Title,
            Description =  i.Description,
            NumOfItems = i.Items.Count
        }).ToList();
        return new Response<List<GetTopInventoriesDto>>(200,"Success",dto);
    }
}