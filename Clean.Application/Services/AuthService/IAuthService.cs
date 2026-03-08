using Clean.Application.Dtos;
using Clean.Application.Responses;
using Clean.Domain.Entities;

namespace Clean.Application.Services;

public interface IAuthService
{
    Task<Response<string>> Login(UserLoginDto user);
    string CreateToken(User user);
}