using Clean.Application.Abstractions;
using Clean.Domain.Entities;
using Clean.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace Clean.Infrastructure.Repositories;

public class AuthRepository(DataContext context):IAuthRepository
{
    public async Task<User?> Login(string email)
    {
        var find = await context.Users.FirstOrDefaultAsync(u => u.Email == email);
        return find;
    }
    public async Task Update()
    {
        await context.SaveChangesAsync();
    }
}