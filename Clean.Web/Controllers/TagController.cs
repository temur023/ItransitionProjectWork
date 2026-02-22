using Clean.Application.Dtos;
using Clean.Application.Filters;
using Clean.Application.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ProjectWork.Controllers;

[ApiController]
[Route("api/[controller]")]
public class TagController(ITagService service) : ControllerBase
{
    [HttpGet("get-all")]
    public async Task<IActionResult> GetAll([FromQuery] TagFilter filter)
    {
        var response = await service.GetAll(filter);
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
    public async Task<IActionResult> Create(TagCreateDto dto)
    {
        var response = await service.Create(dto);
        if (response.StatusCode != 200)
            return StatusCode(response.StatusCode);
        return Ok(response);
    }
    [Authorize]
    [HttpDelete("delete/{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        var response = await service.Delete(id);
        if (response.StatusCode != 200)
            return StatusCode(response.StatusCode);
        return Ok(response);
    }
}
