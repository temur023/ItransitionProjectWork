using Clean.Application.Dtos;
using Clean.Application.Filters;
using Clean.Application.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ProjectWork.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ItemController(IItemService service) : ControllerBase
{
    [HttpGet("get-all")]
    public async Task<IActionResult> GetAll([FromQuery] ItemFilter filter,[FromQuery] int invId)
    {
        var response = await service.GetAll(filter, invId);
        if (response.StatusCode != 200)
            return StatusCode(response.StatusCode);
        return Ok(response);
    }

    [HttpGet("get/{id}")]
    public async Task<IActionResult> GetById(int id)
    {
        var response = await service.GetById(id);
        if (response.StatusCode != 200)
            return StatusCode(response.StatusCode);
        return Ok(response);
    }
    [Authorize]
    [HttpPost("create")]
    public async Task<IActionResult> Create([FromBody] ItemCreateDto dto)
    {
        try
        {
            var response = await service.Create(dto);
            return StatusCode(response.StatusCode, response);
        }
        catch (Exception ex)
        {
            Console.WriteLine("EXCEPTION: " + ex.Message);
            Console.WriteLine("STACK: " + ex.StackTrace);
            return BadRequest(new { error = ex.Message, stack = ex.StackTrace });
        }
    }
    [Authorize]
    [HttpPut("update/{id}")]
    public async Task<IActionResult> Update(int id, [FromBody] ItemCreateDto dto)
    {
        dto.Id = id; // set ID from route
        var response = await service.Update(dto);
        if (response.StatusCode != 200)
            return StatusCode(response.StatusCode);
        return Ok(response);
    }
    
    [Authorize]
    [HttpDelete("delete-selected")]
    public async Task<IActionResult> DeleteSelected([FromQuery] int invId,[FromBody] List<int> selectedIds)
    {
        var response = await service.DeleteSelected(invId, selectedIds);
        if (response.StatusCode != 200)
            return StatusCode(response.StatusCode);
        return Ok(response);
    }
}
