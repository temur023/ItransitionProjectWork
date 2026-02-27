using Clean.Application.Filters;
using Clean.Application.Services.UserPageService;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ProjectWork.Controllers;

[ApiController]
[Route("api/[controller]")]
public class UserPageController(IUserPageService service):ControllerBase
{
    [Authorize]
    [HttpGet("get-with-access")]
    public async Task<IActionResult> GetAllWithAccess([FromQuery] InventoryFilter filter)
    {
        var response = await service.GetInvsWithAccess(filter);
        if (response.StatusCode != 200)
            return StatusCode(response.StatusCode);
        return Ok(response);
    }
    [Authorize]
    [HttpGet("get-own")]
    public async Task<IActionResult> GetAllOwn([FromQuery] InventoryFilter filter)
    {
        var response = await service.GetOwnInvs(filter);
        if (response.StatusCode != 200)
            return StatusCode(response.StatusCode);
        return Ok(response);
    }

    [Authorize]
    [HttpDelete("delete-own")]
    public async Task<IActionResult> DeleteSelected(List<int> selectedIds)
    {
        var response = await service.DeleteSelected(selectedIds);
        if (response.StatusCode != 200)
            return StatusCode(response.StatusCode);
        return Ok(response);
    }
}