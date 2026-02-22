namespace Clean.Application.Dtos;

public class UserLoginDto
{
    public string? UserName { get; set; }
    public string? Email { get; set; }
    public string PasswordHash { get; set; }
}