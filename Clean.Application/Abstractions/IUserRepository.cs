using Clean.Application.Dtos;
using Clean.Application.Filters;
using Clean.Domain.Entities;

namespace Clean.Application.Abstractions;

public interface IUserRepository
{
    Task<(List<User> Users, int Total)> GetAll(UserFilter filter);
    Task<User> GetById(int id);
    Task<int> GetByEmailOrUsername(string input);
    Task<bool> ExistsByUserNameOrEmail(string userName, string email);
    Task<int> Create(User user);
    Task<int> Delete(int id);
    Task<List<User>> SelectUsers(List<int> ids);
    Task<List<User>> DeleteSelected(List<int> ids);
    Task SaveChanges();
}