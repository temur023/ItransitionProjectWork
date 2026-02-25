using System.Text.Json.Serialization;

namespace Clean.Application.Dtos;

public class UserLoginDto
{
    public string? LoginInput { get; set; }

    public string? UserName { get; set; }
    public string? Email { get; set; }
    
    public string? PasswordHash { get; set; }
}