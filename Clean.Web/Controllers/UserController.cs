using Clean.Application.Dtos;
using Clean.Application.Filters;
using Clean.Application.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ProjectWork.Controllers;

[ApiController]
[Route("api/[controller]")]
public class UserController(IUserService service) : ControllerBase
{
    
    [HttpGet("get-all")]
    public async Task<IActionResult> GetAll([FromQuery] UserFilter filter)
    {
        var response = await service.GetAll(filter);
        if (response.StatusCode != 200)
            return StatusCode(response.StatusCode);
        return Ok(response);
    }
    [Authorize(Roles = "Admin")]
    [HttpGet("get/{id}")]
    public async Task<IActionResult> GetById(int id)
    {
        var response = await service.GetById(id);
        if (response.StatusCode != 200)
            return StatusCode(response.StatusCode);
        return Ok(response);
    }

    [HttpPost("create")]
    public async Task<IActionResult> Create(UserCreateDto dto)
    {
        var response = await service.Create(dto);
        if (response.StatusCode != 200)
            return StatusCode(response.StatusCode);
        return Ok(response);
    }
    [Authorize(Roles = "Admin")]
    [HttpPut("update/{id}")]
    public async Task<IActionResult> Update(int id,UserCreateDto dto)
    {
        var response = await service.Update(dto, id);
        if (response.StatusCode != 200)
            return StatusCode(response.StatusCode);
        return Ok(response);
    }
    [Authorize(Roles = "Admin")]
    [HttpDelete("delete")]
    public async Task<IActionResult> DeleteSelected(List<int> ids)
    {
        var response = await service.DeleteSelected(ids);
        if (response.StatusCode != 200)
            return StatusCode(response.StatusCode);
        return Ok(response);
    }
    [Authorize(Roles = "Admin")]
    [HttpDelete("ublock")]
    public async Task<IActionResult> UnBlockSelected(List<int> ids)
    {
        var response = await service.UnBlockSelected(ids);
        if (response.StatusCode != 200)
            return StatusCode(response.StatusCode);
        return Ok(response);
    }
    [Authorize(Roles = "Admin")]
    [HttpPut("block")]
    public async Task<IActionResult> BlockSelected(List<int> ids)
    {
        var response = await service.BlockSelected(ids);
        if (response.StatusCode != 200)
            return StatusCode(response.StatusCode);
        return Ok(response);
    }
    [Authorize(Roles = "Admin")]
    [HttpPut("making-admin")]
    public async Task<IActionResult> MakingAdmin(int id)
    {
        var response = await service.MakingAdmin(id);
        if (response.StatusCode != 200)
            return StatusCode(response.StatusCode);
        return Ok(response);
    }
    [Authorize(Roles = "Admin")]
    [HttpPut("removing-admin")]
    public async Task<IActionResult> RemovingAdmin(int id)
    {
        var response = await service.RemovingAdmin(id);
        if (response.StatusCode != 200)
            return StatusCode(response.StatusCode);
        return Ok(response);
    }
}
