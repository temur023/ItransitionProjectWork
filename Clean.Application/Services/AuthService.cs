using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Clean.Application.Abstractions;
using Clean.Application.Dtos;
using Clean.Application.Responses;
using Clean.Domain.Entities;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;

namespace Clean.Application.Services;

public class AuthService(IAuthRepository repository, IConfiguration configuration):IAuthService
{
    public async Task<Response<string>> Login(UserLoginDto user)
    {
        var usr = await repository.Login(user.Email);
        if (usr == null) 
            return new Response<string>(404, "User not found!");
        if (usr.PasswordHash != user.PasswordHash)
            return new Response<string>(400, "The password is incorrect!");
        if (usr.IsBlocked == true)
            return new Response<string>(400, "You cannot login because you are blocked!");
        var token = CreateToken(usr);
        await repository.Update();
        return new Response<string>(200, token);
    }
    
    
    private string CreateToken(User user)
    {
        var claims = new List<Claim>
        {
            new Claim(ClaimTypes.Name, user.FullName),
            new Claim(ClaimTypes.Email, user.Email),
            new Claim(ClaimTypes.NameIdentifier, user.Id.ToString())
        };
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(configuration["Jwt:Key"]!));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var tokenDescriptor = new JwtSecurityToken(
            issuer: configuration["Jwt:Issuer"],
            audience: configuration["Jwt:Audience"],
            claims: claims,
            expires: DateTime.UtcNow.AddDays(1),
            signingCredentials: creds
        );
        return new JwtSecurityTokenHandler().WriteToken(tokenDescriptor); 
    }
}