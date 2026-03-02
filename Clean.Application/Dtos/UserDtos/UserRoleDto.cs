using Clean.Domain.Entities.Enums;

namespace Clean.Application.Dtos;

public class UserRoleDto
{
    public int Id { get; set; }
    public UserRole Role { get; set; }
}