using Clean.Application.Abstractions;
using Microsoft.AspNetCore.Mvc;

namespace ProjectWork.Controllers;

[ApiController]
[Route("api/[controller]")]
public class SearchContoller(ISearchRepository repository):ControllerBase
{
    [HttpGet("search")]
    public async Task<IActionResult> Search([FromQuery] string q, [FromQuery] int? tagId)
    {
        if (string.IsNullOrWhiteSpace(q)) return BadRequest("Query is required");
    
        var items = await repository.SearchItems(q, tagId);
        var inventories = await repository.SearchInventories(q);
    
        return Ok(new { items, inventories });
    }
}