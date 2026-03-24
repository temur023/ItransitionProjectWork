using Clean.Application.Abstractions;
using Clean.Application.Dtos;
using Clean.Application.Services.SupportTicketService;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ProjectWork.Controllers;

[ApiController]
[Route("api/[controller]")]
public class SupportTicketController(
    ISupportTicketService service,
    IUserRepository userRepository) : ControllerBase
{
    [Authorize]
    [HttpPost("create")]
    public async Task<IActionResult> Create([FromBody] SupportTicketDto dto)
    {
        // get admin emails from DB
        var adminEmails = await userRepository.GetAdminEmails();
        dto.AdminEmails = adminEmails;

        var response = await service.UploadTicket(dto);
        if (response.StatusCode != 200)
            return StatusCode(response.StatusCode, response);
        return Ok(response);
    }
}