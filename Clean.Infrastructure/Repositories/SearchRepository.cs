using Clean.Application.Abstractions;
using Clean.Domain.Entities;
using Clean.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace Clean.Infrastructure.Repositories;

public class SearchRepository(DataContext context):ISearchRepository
{
    public async Task<List<Item>> SearchItems(string query, int? tagId = null)
    {
        var tsQuery = EF.Functions.ToTsQuery("english", string.Join(" & ", query.Split(' ')));

        return await context.Items.Where(i => i.SearchVector.Matches(tsQuery))
            .OrderByDescending(i => i.SearchVector.RankCoverDensity(tsQuery))
            .Take(50)
            .ToListAsync();
    }

    public async Task<List<Inventory>> SearchInventories(string query)
    {
        var tsQuery = EF.Functions.ToTsQuery("english", string.Join(" & ", query.Split(' ')));

        return await context.Inventories
            .Where(i => i.SearchVector.Matches(tsQuery))
            .OrderByDescending(i => i.SearchVector.RankCoverDensity(tsQuery))
            .Take(50)
            .ToListAsync();
    }
}