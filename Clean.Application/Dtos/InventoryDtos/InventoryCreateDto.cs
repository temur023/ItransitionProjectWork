using Clean.Domain.Entities;
using Clean.Domain.Entities.Enums;

namespace Clean.Application.Dtos;

public class InventoryCreateDto
{
    public int Id { get; set; }
    public string Title { get; set; }
    public string Description { get; set; }
    public string? ImageUrl { get; set; }

    public bool IsPublic { get; set; }

    public int Version { get; set; }
    public Category Category { get; set; }
    public int CreatedById { get; set; }
    public DateTimeOffset CreatedAt { get; set; }
}