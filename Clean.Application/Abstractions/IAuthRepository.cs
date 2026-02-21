using Clean.Domain.Entities;

namespace Clean.Application.Abstractions;

public interface IAuthRepository
{
    Task<User?> Login(string email);
    Task Update();
}