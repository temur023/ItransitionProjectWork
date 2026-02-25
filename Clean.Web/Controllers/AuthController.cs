using Clean.Application.Dtos;
using Clean.Application.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ProjectWork.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController(IAuthService authService) : ControllerBase
{
    [HttpPost("login")]
    public async Task<IActionResult> Login(UserLoginDto dto)
    {
        var response = await authService.Login(dto);
        if (response.StatusCode != 200)
            return StatusCode(response.StatusCode, new { message = response.Message }); // ✅ JSON object
        return Ok(new { token = response.Data });
    }
}
