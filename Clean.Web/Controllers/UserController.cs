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
    [Authorize(Roles = "Admin")]
    [HttpGet("get-all")]
    public async Task<IActionResult> GetAll([FromQuery] UserFilter filter)
    {
        var response = await service.GetAll(filter);
        if (response.StatusCode != 200)
            return StatusCode(response.StatusCode);
        return Ok(response);
    }
    [Authorize]
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
    [Authorize]
    [HttpPut("update/{id}")]
    public async Task<IActionResult> Update(int id, [FromBody] UserEditDto dto)
    {
        var response = await service.Update(dto, id);
        if (response.StatusCode != 200)
            return StatusCode(response.StatusCode);
        return Ok(response);
    }
    [Authorize(Roles = "Admin")]
    [HttpDelete("delete-selected")]
    public async Task<IActionResult> DeleteSelected(List<int> ids)
    {
        var response = await service.DeleteSelected(ids);
        if (response.StatusCode != 200)
            return StatusCode(response.StatusCode);
        return Ok(response);
    }
    [Authorize(Roles = "Admin")]
    [HttpPut("unblock")]
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
    public async Task<IActionResult> MakingAdminSelected(List<int> ids)
    {
        var response = await service.MakeAdminSelected(ids);
        if (response.StatusCode != 200)
            return StatusCode(response.StatusCode);
        return Ok(response);
    }
    [Authorize(Roles = "Admin")]
    [HttpPut("removing-admin")]
    public async Task<IActionResult> RemoveAdminSelected(List<int> ids)
    {
        var response = await service.RemoveAdminSelected(ids);
        if (response.StatusCode != 200)
            return StatusCode(response.StatusCode);
        return Ok(response);
    }
}
