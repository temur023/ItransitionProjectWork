using Clean.Domain.Entities.Enums;

namespace Clean.Application.Dtos.MainPageDto;

public class GetTopInventoriesDto
{
    public int Id { get; set; }
    public string Name { get; set; }
    public Category Category { get; set; }
    public string Creator  { get; set; }
    public int NumOfItems { get; set; }
}