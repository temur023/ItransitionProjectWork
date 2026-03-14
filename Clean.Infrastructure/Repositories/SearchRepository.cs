using Clean.Application.Abstractions;
using Clean.Domain.Entities;
using Clean.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace Clean.Infrastructure.Repositories;

public class SearchRepository(DataContext context):ISearchRepository
{
    private static string BuildTsQueryString(string query)
    {
        var words = query.Split(' ', StringSplitOptions.RemoveEmptyEntries); // ensures not creating of empty string " "
        return string.Join(" & ", words.Select(w => w + ":*")); // joins and makes run match running runner
    }

    public async Task<List<Item>> SearchItems(string query, int? tagId = null)
    {
        var tsQuery = BuildTsQueryString(query);

        var results = await context.Items
            .AsNoTracking()
            .Include(i => i.Inventory)
            .Where(i => i.SearchVector.Matches(EF.Functions.ToTsQuery("english", tsQuery)))
            .OrderByDescending(i => i.SearchVector.RankCoverDensity(EF.Functions.ToTsQuery("english", tsQuery)))//ranks by how the exact word is matching
            .Take(50)
            .ToListAsync();

        if (results.Count == 0)
        {
            var pattern = $"%{query}%";
            results = await context.Items
                .AsNoTracking()
                .Include(i => i.Inventory)
                .Where(i => EF.Functions.ILike(i.Name, pattern) ||
                             EF.Functions.ILike(i.CustomId, pattern))
                .Take(50)
                .ToListAsync();
        }

        return results;
    }

    public async Task<List<Inventory>> SearchInventories(string query)
    {
        var tsQuery = BuildTsQueryString(query);

        var results = await context.Inventories
            .AsNoTracking()
            .Include(i => i.CreatedBy)
            .Where(i => i.SearchVector.Matches(EF.Functions.ToTsQuery("english", tsQuery)))
            .OrderByDescending(i => i.SearchVector.RankCoverDensity(EF.Functions.ToTsQuery("english", tsQuery)))
            .Take(50)
            .ToListAsync();

        if (results.Count == 0)
        {
            var pattern = $"%{query}%";
            results = await context.Inventories
                .AsNoTracking()
                .Include(i => i.CreatedBy)
                .Where(i => EF.Functions.ILike(i.Title, pattern) ||
                             EF.Functions.ILike(i.Description, pattern))
                .Take(50)
                .ToListAsync();
        }

        return results;
    }

    public async Task<List<User>> SearchUsers(string query)
    {
        var tsQuery = BuildTsQueryString(query);

        var results = await context.Users
            .Where(i => i.SearchVector.Matches(EF.Functions.ToTsQuery("english", tsQuery)))
            .OrderByDescending(i => i.SearchVector.RankCoverDensity(EF.Functions.ToTsQuery("english", tsQuery)))
            .Take(50)
            .ToListAsync();

        if (results.Count == 0)
        {
            var pattern = $"%{query}%";
            results = await context.Users
                .Where(u => EF.Functions.ILike(u.UserName, pattern) ||
                             EF.Functions.ILike(u.Email, pattern) ||
                             EF.Functions.ILike(u.FullName, pattern))
                .Take(50)
                .ToListAsync();
        }

        return results;
    }
}