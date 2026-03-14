using System.Text.Json;
using Clean.Application.Services;
using Clean.Domain.Entities;
using Clean.Domain.Entities.Enums;
using Clean.Infrastructure.Data;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace ProjectWork.Controllers;

// ExternalAuthController.cs
[ApiController]
[Route("api/[controller]")]
public class ExternalAuthController(DataContext _db, IAuthService _jwtService, IHttpClientFactory _httpClientFactory) : ControllerBase
{
    [HttpPost("login")]
    public async Task<IActionResult> ExternalLogin([FromBody] ExternalLoginDto dto)
    {
        try
        {
            UserInfo userInfo;

            if (dto.Provider == "Google")
                userInfo = await VerifyGoogleToken(dto.Token);
            else if (dto.Provider == "Facebook")
                userInfo = await VerifyFacebookToken(dto.Token);
            else
                return BadRequest("Unsupported provider");

            var user = await _db.Users.FirstOrDefaultAsync(u => u.Email == userInfo.Email);
            if (user == null)
            {
                user = new User
                {
                    Email = userInfo.Email,
                    FullName = userInfo.Name,
                    UserName = Guid.NewGuid().ToString(),
                    Role = UserRole.User,
                    IsBlocked = false,
                    Language = PreferedLanguage.English,
                    Theme = PreferedTheme.Light,
                    PasswordHash = ""
                };
                _db.Users.Add(user);
                await _db.SaveChangesAsync();
            }

            var token = _jwtService.CreateToken(user);
            return Ok(new { token });
        }
        catch (Exception ex)
        {
            Console.WriteLine("ExternalAuth error: " + ex.Message);
            return StatusCode(500, new { message = ex.Message });
        }
    }

    private async Task<UserInfo> VerifyGoogleToken(string idToken)
    {
        var http = _httpClientFactory.CreateClient();
        var response = await http.GetAsync(
            $"https://oauth2.googleapis.com/tokeninfo?id_token={idToken}"
        );

        var rawJson = await response.Content.ReadAsStringAsync();
        Console.WriteLine("Google response: " + rawJson);

        if (!response.IsSuccessStatusCode)
            throw new Exception("Invalid Google token: " + rawJson);

        var json = JsonSerializer.Deserialize<JsonElement>(rawJson);

        return new UserInfo
        {
            Email = json.GetProperty("email").GetString(),
            Name = json.TryGetProperty("name", out var nameProp)
                ? nameProp.GetString()
                : json.GetProperty("email").GetString()
        };
    }

    private async Task<UserInfo> VerifyFacebookToken(string accessToken)
    {
        var http = _httpClientFactory.CreateClient();
        var response = await http.GetAsync(
            $"https://graph.facebook.com/me?fields=name,email&access_token={accessToken}"
        );
        
        var rawJson = await response.Content.ReadAsStringAsync();
        Console.WriteLine("Facebook response: " + rawJson);

        if (!response.IsSuccessStatusCode)
            throw new Exception("Invalid Facebook token: " + rawJson);

        var json = JsonSerializer.Deserialize<JsonElement>(rawJson);
        
        var email = json.TryGetProperty("email", out var emailProp)
            ? emailProp.GetString()
            : json.GetProperty("id").GetString() + "@facebook.com";

        var name = json.TryGetProperty("name", out var nameProp)
            ? nameProp.GetString()
            : "Facebook User";

        return new UserInfo { Email = email, Name = name };
    }
}

public class ExternalLoginDto
{
    public string Provider { get; set; }
    public string Token { get; set; }
}

public class UserInfo
{
    public string Email { get; set; }
    public string Name { get; set; }
}