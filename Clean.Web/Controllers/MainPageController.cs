using Clean.Application.Abstractions;
using Clean.Application.Services.MainPage;
using Microsoft.AspNetCore.Mvc;

namespace ProjectWork.Controllers;

[ApiController]
[Route("api/[controller]")]
public class MainPageController(IMainPageService service):ControllerBase
{
    [HttpGet("get-latest")]
    public async Task<IActionResult> GetLatest()
    {
        var response = await service.GetLatestInventories();
        return Ok(response);
    }
    [HttpGet("get-top")]
    public async Task<IActionResult> GetTop()
    {
        var response = await service.GetTopInventories();
        return Ok(response);
    }
}