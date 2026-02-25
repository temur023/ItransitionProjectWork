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
        var loginInput = !string.IsNullOrEmpty(user.Email)
            ? user.Email
            : !string.IsNullOrEmpty(user.UserName)
                ? user.UserName
                : user.LoginInput;

        if (string.IsNullOrWhiteSpace(loginInput) || string.IsNullOrWhiteSpace(user.PasswordHash))
            return new Response<string>(400, "Email/username and password are required!", null);

        var usr = await repository.Login(loginInput);
        if (usr == null) 
            return new Response<string>(404, "User not found!", null);
        if (usr.PasswordHash != user.PasswordHash)
            return new Response<string>(400, "The password is incorrect!", null);
        if (usr.IsBlocked == true)
            return new Response<string>(400, "You cannot login because you are blocked!",null);
        var token = CreateToken(usr);
        await repository.Update();
        return new Response<string>(200,"Login successful", token);
    }
    
    
    private string CreateToken(User user)
    {
        var claims = new List<Claim>
        {
            new Claim(ClaimTypes.Name, user.FullName),
            new Claim(ClaimTypes.Email, user.Email),
            new Claim(ClaimTypes.Role,user.Role.ToString()),
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