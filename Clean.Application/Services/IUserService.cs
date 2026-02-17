using Clean.Application.Dtos;
using Clean.Application.Filters;
using Clean.Application.Responses;

namespace Clean.Application.Services;

public interface IUserService
{
    Task<PagedResponse<UserGetDto>> GetAll(UserFilter filter);
    Task<Response<UserGetDto>> GetById(int id);
    Task<Response<string>> Create(UserCreateDto dto);
    Task<Response<string>> Update(UserCreateDto dto, int id);
    Task<Response<string>> Delete(int id);
}