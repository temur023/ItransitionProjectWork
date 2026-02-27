using Clean.Application.Abstractions;
using Clean.Application.Dtos;
using Clean.Application.Filters;
using Clean.Domain.Entities;
using Clean.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace Clean.Infrastructure.Repositories;

public class UserRepository(DataContext context):IUserRepository
{
    public async Task<(List<User> Users, int Total)> GetAll(UserFilter filter)
    {
        var query = context.Users.AsNoTracking();
        
        if (!string.IsNullOrWhiteSpace(filter.SearchTerm))
        {
            var term = filter.SearchTerm.ToLower();
            query = query.Where(u => u.UserName.ToLower().Contains(term) 
                                     || u.Email.ToLower().Contains(term));
        }
        
        var total = await query.CountAsync();
        var users =  await query.Skip((filter.PageNumber - 1) * filter.PageSize) 
            .Take(filter.PageSize)
            .ToListAsync();
        return (users, total);
    }

    public async Task<User> GetById(int id)
    {
        var find = await context.Users.FirstOrDefaultAsync(u=>u.Id == id);
        return find;
    }
    public async Task<int> GetByEmailOrUsername(string input)
    {
        var user = await context.Users
            .FirstOrDefaultAsync(a => a.Email.Contains(input)|| a.UserName.Contains(input));
        return user?.Id ?? -1;
    }
    public async Task<int> Create(User user)
    {
        context.Users.Add(user);
        await context.SaveChangesAsync();
        return user.Id;
    }

    public async Task<int> Delete(int id)
    {
        var find = await context.Users.FirstOrDefaultAsync(u=>u.Id == id);
        if (find == null) return -1;
        context.Users.Remove(find);
        await context.SaveChangesAsync();
        return find.Id;
    }

    public async Task<List<User>> BlockSelected(List<int> ids)
    {
        var users = await context.Users.Where(u => ids.Contains(u.Id)).ToListAsync();
        return users;
    }

    public async Task<List<User>> DeleteSelected(List<int> ids)
    {
        var users = await context.Users.Where(u => ids.Contains(u.Id)).ToListAsync();
        context.Users.RemoveRange(users);
        await context.SaveChangesAsync();
        return users;
    }
    

    public async Task<List<User>> UnBlockSelected(List<int> ids)
    {
        var users = await context.Users.Where(u => ids.Contains(u.Id)).ToListAsync();
        return users;
    }

    public async Task SaveChanges()
    {
        await context.SaveChangesAsync();
    }
}