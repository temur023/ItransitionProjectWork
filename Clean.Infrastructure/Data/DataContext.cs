using Clean.Application.Abstractions;
using Clean.Domain;
using Clean.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Text;

namespace Clean.Infrastructure.Data;
public class DataContext : DbContext, IDbContext
{
    public DataContext(DbContextOptions<DataContext> options):base(options){}

    public DbSet<User> Users { get; set; }
    public DbSet<Inventory> Inventories { get; set; }
    public DbSet<Tag> Tags { get; set; }
    public DbSet<Item> Items { get; set; }
    public DbSet<InventoryField> InventoryFields { get; set; }
    public DbSet<ItemFieldValue> ItemFieldValues { get; set; }
    public DbSet<InventoryComment> InventoryComments { get; set; }
    public DbSet<InventoryUserAccess> InventoryUserAccesses { get; set; }
    public DbSet<ItemLike> ItemLikes { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);
        modelBuilder.Entity<Item>()
            .HasIndex(i => new { i.InventoryId, i.CustomId })
            .IsUnique();
        modelBuilder.Entity<Item>()
            .Property(i => i.CustomId)
            .IsRequired();
        modelBuilder.Entity<InventoryUserAccess>()
            .HasKey(i => new { i.InventoryId, i.UserId });
        modelBuilder.Entity<ItemLike>()
            .HasKey(i => new { i.ItemId, i.UserId });

        modelBuilder.Entity<User>()
            .HasIndex(u => u.Email)
            .IsUnique();

        modelBuilder.Entity<Tag>()
            .HasIndex(t => t.Name)
            .IsUnique();

        modelBuilder.Entity<ItemFieldValue>()
            .HasIndex(v => new { v.ItemId, v.FieldId })
            .IsUnique();
    }
}

