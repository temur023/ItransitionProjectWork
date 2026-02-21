using Clean.Domain;
using Clean.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace Clean.Application.Abstractions;

public interface IDbContext
{
    DbSet<User> Users { get; set; }
    DbSet<Inventory> Inventories { get; set; }
    DbSet<Tag> Tags { get; set; }
    DbSet<Item> Items { get; set; }
    DbSet<InventoryField> InventoryFields { get; set; }
    DbSet<ItemFieldValue> ItemFieldValues { get; set; }
    DbSet<InventoryComment> InventoryComments { get; set; }
    DbSet<InventoryUserAccess> InventoryUserAccesses { get; set; }
    DbSet<ItemLike> ItemLikes { get; set; }
    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
}

