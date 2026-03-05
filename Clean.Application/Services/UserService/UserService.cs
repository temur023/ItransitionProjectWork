using System.Security.Claims;
using Clean.Application.Abstractions;
using Clean.Application.Dtos;
using Clean.Application.Filters;
using Clean.Application.Responses;
using Clean.Domain.Entities;
using Clean.Domain.Entities.Enums;
using Microsoft.AspNetCore.Http;

namespace Clean.Application.Services;

public class UserService(IUserRepository repository, IHttpContextAccessor httpContextAccessor):IUserService
{
    private int? GetCurrentUserId() =>
        int.TryParse(httpContextAccessor.HttpContext?.User?.FindFirst(ClaimTypes.NameIdentifier)
            ?.Value, out var userId) ? userId : null;
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
            Role = UserRole.User,
            IsBlocked = false,
            PasswordHash = dto.PasswordHash,
            Theme = dto.Theme,
        };
        var user = await repository.Create(model);
        return new Response<string>(200, "User created");
    }
    public async Task<Response<string>> Update(UserEditDto dto, int id)
    {
        var currentUserId = GetCurrentUserId();
        if(currentUserId == null)
            return new Response<string>(409, "You are not authorized");
        var currentUser = await repository.GetById((int)currentUserId);
        var user = await repository.GetById(id);
        if (currentUserId != user.Id && currentUser.Role != UserRole.Admin)
        {
            return new Response<string>(409, "You are not authorized");
        }

        user.FullName = dto.FullName;
        user.Language = dto.Language;
        if (!string.IsNullOrWhiteSpace(dto.PasswordHash))
            user.PasswordHash = dto.PasswordHash;
        user.Theme = dto.Theme;
        if (currentUser.Role == UserRole.Admin)
        {
            user.Role = dto.Role;
            user.IsBlocked = dto.IsBlocked;
        }
        await repository.SaveChanges();
        return new Response<string>(200, "User updated");
    }
    

    public async Task<Response<string>> BlockSelected(List<int> ids)
    {
        var currentUserId = GetCurrentUserId();
        if(currentUserId == null)
            return new Response<string>(409, "You are not authorized");
        var currentUser = await repository.GetById((int)currentUserId);
        if(currentUser.Role!=UserRole.Admin)
            return new Response<string>(409, "You are not authorized");
        var users = await repository.SelectUsers(ids);
        foreach (var user in users)
        {
            user.IsBlocked = true;
        }
        await repository.SaveChanges();
        return new Response<string>(200, "Success");
    }

    public async Task<Response<string>> UnBlockSelected(List<int> ids)
    {
        var currentUserId = GetCurrentUserId();
        if(currentUserId == null)
            return new Response<string>(409, "You are not authorized");
        var currentUser = await repository.GetById((int)currentUserId);
        if(currentUser.Role!=UserRole.Admin)
            return new Response<string>(409, "You are not authorized");
        var users = await repository.SelectUsers(ids);
        foreach (var user in users)
        {
            user.IsBlocked = false;
        }
        await repository.SaveChanges();
        return new Response<string>(200, "Success");
    }
    public async Task<Response<string>> MakeAdminSelected(List<int> ids)
    {
        var currentUserId = GetCurrentUserId();
        if(currentUserId == null)
            return new Response<string>(409, "You are not authorized");
        var currentUser = await repository.GetById((int)currentUserId);
        if(currentUser.Role!=UserRole.Admin)
            return new Response<string>(409, "You are not authorized");
        var users = await repository.SelectUsers(ids);
        foreach (var user in users)
        {
            user.Role = UserRole.Admin;
        }
        await repository.SaveChanges();
        return new Response<string>(200, "Success");
    }
    public async Task<Response<string>> RemoveAdminSelected(List<int> ids)
    {
        var currentUserId = GetCurrentUserId();
        if(currentUserId == null)
            return new Response<string>(409, "You are not authorized");
        var currentUser = await repository.GetById((int)currentUserId);
        if(currentUser.Role!=UserRole.Admin)
            return new Response<string>(409, "You are not authorized");
        var users = await repository.SelectUsers(ids);
        foreach (var user in users)
        {
            user.Role = UserRole.User;
        }
        await repository.SaveChanges();
        return new Response<string>(200, "Success");
    }
    
    public async Task<Response<string>> DeleteSelected(List<int> ids)
    {
        var currentUserId = GetCurrentUserId();
        if(currentUserId == null)
            return new Response<string>(409, "You are not authorized");
        var currentUser = await repository.GetById((int)currentUserId);
        if(currentUser.Role!=UserRole.Admin)
            return new Response<string>(409, "You are not authorized");
        var users = await repository.DeleteSelected(ids);
        return new Response<string>(200, "Success");
    }
}