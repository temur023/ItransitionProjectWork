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
        var total = await query.CountAsync();
        var users =  await query.Skip((filter.PageNumber - 1) * filter.PageNumber) 
            .Take(filter.PageSize)
            .ToListAsync();
        return (users, total);
    }

    public async Task<User> GetById(int id)
    {
        var find = await context.Users.FirstOrDefaultAsync(u=>u.Id == id);
        return find;
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

    public async Task SaveChanges()
    {
        await context.SaveChangesAsync();
    }
}