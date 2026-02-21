using Clean.Application.Dtos;
using Clean.Application.Filters;
using Clean.Application.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ProjectWork.Controllers;

[ApiController]
[Route("api/[controller]")]
public class InventoryController(IInvetoryService service):ControllerBase
{
    [HttpGet("get-all")]
    public async Task<IActionResult> GetAll([FromQuery] InventoryFilter filter)
    {
        var response = await service.GetAll(filter);
        if (response.StatusCode != 200)
        {
            return StatusCode(response.StatusCode);
        }
        return Ok(response);
    }

    [HttpGet("get/{id}")]
    public async Task<IActionResult> GetById(int id)
    {
        var response = await service.GetById(id);
        if (response.StatusCode != 200)
        {
            return StatusCode(response.StatusCode);
        }
        return Ok(response);
    }

    [HttpPost("create")]
    public async Task<IActionResult> Create(InventoryCreateDto dto)
    {
        var response = await service.Create(dto);
        if (response.StatusCode != 200)
        {
            return StatusCode(response.StatusCode);
        }
        return Ok(response); 
    }
    [HttpDelete("delete/{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        var response = await service.Delete(id);
        if (response.StatusCode != 200)
            return StatusCode(response.StatusCode);
        return Ok(response);
    }

    [HttpPost("tag-suggestions")]
    public async Task<IActionResult> GetTagSuggestions(List<string> tags)
    {
        var response = await service.GetTagSuggestions(tags ?? new List<string>());
        if (response.StatusCode != 200)
            return StatusCode(response.StatusCode);
        return Ok(response);
    }
}