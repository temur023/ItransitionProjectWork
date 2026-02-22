using Clean.Application.Dtos;
using Clean.Application.Responses;

namespace Clean.Application.Services;

public interface IAuthService
{
    Task<Response<string>> Login(UserLoginDto user);
}