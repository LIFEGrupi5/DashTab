using System.Text.Json;
using DashTab.Domain.Entities;
using DashTab.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace DashTab.Infrastructure.Persistence;

public class DashTabDbContext(DbContextOptions<DashTabDbContext> options) : DbContext(options)
{
    public DbSet<User> Users { get; set; } = null!;
    public DbSet<MenuCategory> MenuCategories { get; set; } = null!;
    public DbSet<MenuItem> MenuItems { get; set; } = null!;
    public DbSet<Order> Orders { get; set; } = null!;
    public DbSet<OrderItem> OrderItems { get; set; } = null!;
    public DbSet<AuditLog> AuditLogs { get; set; } = null!;

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<User>()
            .HasIndex(u => u.Email).IsUnique();
        modelBuilder.Entity<User>()
            .Property(u => u.Role).HasConversion<string>();
        modelBuilder.Entity<User>()
            .HasQueryFilter(u => !u.IsDeleted);

        modelBuilder.Entity<MenuCategory>()
            .HasIndex(c => c.Name).IsUnique();
        modelBuilder.Entity<MenuCategory>()
            .HasQueryFilter(c => !c.IsDeleted);

        modelBuilder.Entity<MenuItem>()
            .HasOne(m => m.Category)
            .WithMany(c => c.MenuItems)
            .HasForeignKey(m => m.CategoryId)
            .OnDelete(DeleteBehavior.Restrict);
        modelBuilder.Entity<MenuItem>()
            .HasQueryFilter(m => !m.IsDeleted);

        modelBuilder.Entity<Order>()
            .Property(o => o.Status).HasConversion<string>();
        modelBuilder.Entity<Order>()
            .HasOne(o => o.CreatedBy)
            .WithMany(u => u.Orders)
            .HasForeignKey(o => o.CreatedById)
            .OnDelete(DeleteBehavior.Restrict);
        modelBuilder.Entity<Order>()
            .HasQueryFilter(o => !o.IsDeleted);

        modelBuilder.Entity<OrderItem>()
            .HasOne(i => i.Order)
            .WithMany(o => o.Items)
            .HasForeignKey(i => i.OrderId)
            .OnDelete(DeleteBehavior.Cascade);
        modelBuilder.Entity<OrderItem>()
            .HasOne(i => i.MenuItem)
            .WithMany(m => m.OrderItems)
            .HasForeignKey(i => i.MenuItemId)
            .OnDelete(DeleteBehavior.SetNull);
    }

    public override async Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
      {
          var entries = ChangeTracker.Entries()
              .Where(e => e.State is EntityState.Added or EntityState.Modified or EntityState.Deleted)
              .ToList();

          foreach (var entry in entries)
          {
              var action = entry.State switch
              {
                  EntityState.Added => "Created",
                  EntityState.Modified => "Updated",
                  EntityState.Deleted => "Deleted",
                  _ => "Unknown"
              };

              var entityId = entry.Properties
                  .FirstOrDefault(p => p.Metadata.IsPrimaryKey())?.CurrentValue;

              var oldValues = entry.State is EntityState.Modified or EntityState.Deleted
                  ? JsonSerializer.Serialize(entry.OriginalValues.Properties
                      .ToDictionary(p => p.Name, p => entry.OriginalValues[p]))
                  : null;

              var newValues = entry.State is EntityState.Added or EntityState.Modified
                  ? JsonSerializer.Serialize(entry.CurrentValues.Properties
                      .ToDictionary(p => p.Name, p => entry.CurrentValues[p]))
                  : null;

              AuditLogs.Add(new AuditLog
              {
                  Id = Guid.NewGuid(),
                  EntityName = entry.Metadata.ClrType.Name,
                  EntityId = entityId is Guid g ? g : Guid.Empty,
                  Action = action,
                  ChangedAt = DateTime.UtcNow,
                  OldValues = oldValues,
                  NewValues = newValues,
              });
          }

          return await base.SaveChangesAsync(cancellationToken);
      }
  }
