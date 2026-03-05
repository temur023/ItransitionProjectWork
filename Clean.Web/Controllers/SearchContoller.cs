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

        var itemDtos = items.Select(i => new
        {
            i.Id,
            i.Name,
            i.CustomId,
            i.Description,
            i.InventoryId,
            InventoryTitle = i.Inventory?.Title ?? ""
        });

        var inventoryDtos = inventories.Select(i => new
        {
            i.Id,
            i.Title,
            Category = i.Category.ToString(),
            CreatorName = i.CreatedBy?.UserName ?? ""
        });

        return Ok(new { items = itemDtos, inventories = inventoryDtos });
    }
}
