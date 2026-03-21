using Clean.Application.Dtos.SalesforceDtos;
using Clean.Application.Services.SalesforceService;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ProjectWork.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class SalesforceController(ISalesforceService service) : ControllerBase
{
    [HttpPost("create")]
    public async Task<IActionResult> Create(SalesforceCreateDto dto)
    {
        var response = await service.CreateAccountAndContact(dto);
        if (response.StatusCode != 200)
            return StatusCode(response.StatusCode, response);
        return Ok(response);
    }
}