using Clean.Application.Dtos;
using Clean.Application.Filters;
using Clean.Application.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ProjectWork.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ItemLikeController(IItemLikeService service) : ControllerBase
{
    [HttpGet("get-all")]
    public async Task<IActionResult> GetAll([FromQuery] ItemLikeFilter filter)
    {
        var response = await service.GetAll(filter);
        if (response.StatusCode != 200)
            return StatusCode(response.StatusCode);
        return Ok(response);
    }

    [HttpGet("get/{itemId}/{userId}")]
    public async Task<IActionResult> GetByItemAndUser(int itemId, int userId)
    {
        var response = await service.GetByItemAndUser(itemId, userId);
        if (response.StatusCode != 200)
            return StatusCode(response.StatusCode);
        return Ok(response);
    }
    [Authorize]
    [HttpPost("create")]
    public async Task<IActionResult> Create(ItemLikeCreateDto dto)
    {
        var response = await service.Create(dto);
        if (response.StatusCode != 200)
            return StatusCode(response.StatusCode);
        return Ok(response);
    }
    [Authorize]
    [HttpDelete("delete/{itemId}/{userId}")]
    public async Task<IActionResult> Delete(int itemId, int userId)
    {
        var response = await service.Delete(itemId, userId);
        if (response.StatusCode != 200)
            return StatusCode(response.StatusCode);
        return Ok(response);
    }
}
