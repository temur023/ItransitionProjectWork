using Clean.Application.Filters;
using Clean.Domain.Entities;

namespace Clean.Application.Abstractions;

public interface ITagRepository
{
    Task<(List<Tag> Tags, int Total)> GetAll(TagFilter filter);
    Task<Tag?> GetById(int id);
    Task<Tag?> GetByName(string name);
    void Add(Tag tag);
    Task<int> Create(Tag tag);
    Task<int> Delete(int id);
    Task SaveChanges();
}
