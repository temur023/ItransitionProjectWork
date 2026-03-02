using System.Text.Json.Serialization;

namespace Clean.Application.Dtos;

public class UserLoginDto
{
    [JsonPropertyName("loginInput")]
    public string? LoginInput { get; set; }

    public string? UserName { get; set; }
    public string? Email { get; set; }
    
    [JsonPropertyName("passwordHash")]
    public string? PasswordHash { get; set; }
}