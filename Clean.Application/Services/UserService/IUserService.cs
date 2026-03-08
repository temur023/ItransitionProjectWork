using Clean.Application.Dtos;
using Clean.Application.Filters;
using Clean.Application.Responses;

namespace Clean.Application.Services;

public interface IUserService
{
    Task<PagedResponse<UserGetDto>> GetAll(UserFilter filter);
    Task<Response<UserGetDto>> GetById(int id);
    Task<Response<string>> Create(UserCreateDto dto);
    Task<Response<string>> Update(UserEditDto dto, int id);
    Task<Response<string>> UpdateUserName(string username, int id);
    Task<Response<string>> BlockSelected(List<int> ids);
    Task<Response<string>> UnBlockSelected(List<int> ids);
    Task<Response<string>> MakeAdminSelected(List<int> ids);
    Task<Response<string>> RemoveAdminSelected(List<int> ids);
    Task<Response<string>> DeleteSelected(List<int> ids);
}