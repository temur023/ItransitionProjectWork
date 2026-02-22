using Clean.Application.Abstractions;
using Clean.Application.Dtos;
using Clean.Application.Filters;
using Clean.Application.Responses;
using Clean.Domain.Entities;
using Clean.Domain.Entities.Enums;

namespace Clean.Application.Services;

public class UserService(IUserRepository repository):IUserService
{
    public async Task<PagedResponse<UserGetDto>> GetAll(UserFilter filter)
    {
        var users = await repository.GetAll(filter);
        var dto = users.Users.Select(u=>new UserGetDto()
        {
            Id = u.Id,
            UserName = u.UserName,
            Email = u.Email,
            FullName = u.FullName,
            Language = u.Language,
            Role = u.Role,
            IsBlocked = u.IsBlocked,
            PasswordHash = u.PasswordHash,
            Theme = u.Theme
        }).ToList();
        return new PagedResponse<UserGetDto>(dto,filter.PageNumber, filter.PageSize,users.Total,"Success");
    }

    public async Task<Response<UserGetDto>> GetById(int id)
    {
        var user = await repository.GetById(id);
        var dto = new UserGetDto()
        {
            Id = user.Id,
            UserName =  user.UserName,
            Email = user.Email,
            FullName = user.FullName,
            Language = user.Language,
            Role = user.Role,
            IsBlocked = user.IsBlocked,
            PasswordHash = user.PasswordHash,
            Theme = user.Theme
        };
        return new Response<UserGetDto>(200, "User fond", dto);
    }

    public async Task<Response<string>> Create(UserCreateDto dto)
    {
        var model = new User()
        {
            UserName = dto.UserName,
            Email = dto.Email,
            FullName = dto.FullName,
            Language = dto.Language,
            Role = dto.Role,
            IsBlocked = false,
            PasswordHash = dto.PasswordHash,
            Theme = dto.Theme,
        };
        var user = await repository.Create(model);
        return new Response<string>(200, "User created");
    }

    public async Task<Response<string>> Update(UserCreateDto dto, int id)
    {
        var user = await repository.GetById(id);
        user.UserName = dto.UserName;
        user.Email = dto.Email;
        user.FullName = dto.FullName;
        user.Language = dto.Language;
        user.PasswordHash = dto.PasswordHash;
        user.Theme = dto.Theme;
        await repository.SaveChanges();
        return new Response<string>(200, "User updated");
    }
    

    public async Task<Response<string>> BlockSelected(List<int> ids)
    {
        var users = await repository.BlockSelected(ids);
        foreach (var user in users)
        {
            user.IsBlocked = true;
        }
        return new Response<string>(200, "Success");
    }

    public async Task<Response<string>> UnBlockSelected(List<int> ids)
    {
        var users = await repository.UnBlockSelected(ids);
        foreach (var user in users)
        {
            user.IsBlocked = false;
        }
        return new Response<string>(200, "Success");
    }

    public async Task<Response<string>> DeleteSelected(List<int> ids)
    {
        var users = await repository.DeleteSelected(ids);
        return new Response<string>(200, "Success");
    }

    public async Task<Response<string>> MakingAdmin(int id)
    {
        var user = await repository.GetById(id);
        user.Role = UserRole.Admin;
        return new Response<string>(200, "Success");
    }

    public async Task<Response<string>> RemovingAdmin(int id)
    {
        var user = await repository.GetById(id);
        user.Role = UserRole.User;
        return new Response<string>(200, "Success");
    }
}