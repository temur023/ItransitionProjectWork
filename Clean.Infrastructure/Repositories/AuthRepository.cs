using Clean.Application.Abstractions;
using Clean.Domain.Entities;
using Clean.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace Clean.Infrastructure.Repositories;

public class AuthRepository(DataContext context):IAuthRepository
{
    public async Task<User?> Login(string text)
    {
        User? find = null;
        if (text.Contains("@"))
            find = await context.Users.FirstOrDefaultAsync(u => u.Email == text);
        else
            find = await context.Users.FirstOrDefaultAsync(u => u.UserName == text);
        return find;
    }
    public async Task Update()
    {
        await context.SaveChangesAsync();
    }
}