using Clean.Domain.Entities;
using Clean.Domain.Entities.Enums;

namespace Clean.Application.Dtos;

public class InventoryCreateDto
{
    public int Id { get; set; }
    public string Description { get; set; }
    public Category Category { get; set; }
    public ICollection<Tag> Tags { get; set; }
}