using Clean.Domain.Entities.Enums;

namespace Clean.Application.Dtos;

public class UserCreateDto
{
    public int Id { get; set; }
    public string FullName { get; set; }
    public string Email { get; set; }
    public int PasswordHash { get; set; }
    public bool IsBlocked { get; set; }
    public UserRole Role { get; set; }
    public PreferedLanguage Language { get; set; }
    public PreferedTheme Theme{ get; set; }
}