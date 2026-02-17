using Clean.Application.Abstractions;
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
}

