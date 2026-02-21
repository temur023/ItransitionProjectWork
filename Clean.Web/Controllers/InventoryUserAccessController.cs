using Clean.Application.Dtos;
using Clean.Application.Filters;
using Clean.Application.Services;
using Microsoft.AspNetCore.Mvc;

namespace ProjectWork.Controllers;

[ApiController]
[Route("api/[controller]")]
public class InventoryUserAccessController(IInventoryUserAccessService service) : ControllerBase
{
    [HttpGet("get-all")]
    public async Task<IActionResult> GetAll([FromQuery] InventoryUserAccessFilter filter)
    {
        var response = await service.GetAll(filter);
        if (response.StatusCode != 200)
            return StatusCode(response.StatusCode);
        return Ok(response);
    }

    [HttpGet("get/{inventoryId}/{userId}")]
    public async Task<IActionResult> GetByInventoryAndUser(int inventoryId, int userId)
    {
        var response = await service.GetByInventoryAndUser(inventoryId, userId);
        if (response.StatusCode != 200)
            return StatusCode(response.StatusCode);
        return Ok(response);
    }

    [HttpPost("create")]
    public async Task<IActionResult> Create(InventoryUserAccessCreateDto dto)
    {
        var response = await service.Create(dto);
        if (response.StatusCode != 200)
            return StatusCode(response.StatusCode);
        return Ok(response);
    }

    [HttpDelete("delete/{inventoryId}/{userId}")]
    public async Task<IActionResult> Delete(int inventoryId, int userId)
    {
        var response = await service.Delete(inventoryId, userId);
        if (response.StatusCode != 200)
            return StatusCode(response.StatusCode);
        return Ok(response);
    }
}
