using Clean.Domain.Entities;
using Clean.Domain.Entities.Enums;

namespace Clean.Application.Dtos;

public class InventoryGetDto
{
    public int Id { get; set; }
    public string Description { get; set; }
    public Category Category { get; set; }
    public List<string> Tags { get; set; }
}