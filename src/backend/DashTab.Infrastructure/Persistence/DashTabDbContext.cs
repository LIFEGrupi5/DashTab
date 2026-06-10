using System.Text.Json;
using DashTab.Domain.Entities;
using DashTab.Domain.Enums;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Storage.ValueConversion;

namespace DashTab.Infrastructure.Persistence;

public class DashTabDbContext : DbContext
{
    // Set by RestaurantContextMiddleware once per request. Null in migration/job contexts
    // — filters fall back to allowing all rows so migrations and background jobs work normally.
    public Guid? CurrentTenantId { get; set; }

    public DashTabDbContext(DbContextOptions<DashTabDbContext> options) : base(options) { }

    public DbSet<Restaurant> Restaurants { get; set; } = null!;
    public DbSet<Subscription> Subscriptions { get; set; } = null!;
    public DbSet<User> Users { get; set; } = null!;
    public DbSet<MenuCategory> MenuCategories { get; set; } = null!;
    public DbSet<MenuItem> MenuItems { get; set; } = null!;
    public DbSet<Order> Orders { get; set; } = null!;
    public DbSet<OrderItem> OrderItems { get; set; } = null!;
    public DbSet<AuditLog> AuditLogs { get; set; } = null!;
    public DbSet<WorkShift> WorkShifts { get; set; } = null!;
    public DbSet<ShiftRequest> ShiftRequests { get; set; } = null!;

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<User>()
            .HasIndex(u => u.Email).IsUnique();
        modelBuilder.Entity<User>()
            .Property(u => u.Role).HasConversion<string>();
        modelBuilder.Entity<User>()
            .Property(u => u.IsDeleted).HasDefaultValue(false);
        modelBuilder.Entity<User>()
            .HasQueryFilter(u => !u.IsDeleted && u.RestaurantId == CurrentTenantId);
        modelBuilder.Entity<User>()
            .HasOne(u => u.Restaurant)
            .WithMany()
            .HasForeignKey(u => u.RestaurantId)
            .OnDelete(DeleteBehavior.Restrict);

        // Category names are unique PER RESTAURANT, not globally — otherwise two
        // restaurants could not both have e.g. a "Drinks" category.
        modelBuilder.Entity<MenuCategory>()
            .HasIndex(c => new { c.RestaurantId, c.Name }).IsUnique();
        modelBuilder.Entity<MenuCategory>()
            .Property(c => c.IsDeleted).HasDefaultValue(false);
        modelBuilder.Entity<MenuCategory>()
            .HasQueryFilter(c => !c.IsDeleted && c.RestaurantId == CurrentTenantId);
        modelBuilder.Entity<MenuCategory>()
            .HasOne(c => c.Restaurant)
            .WithMany()
            .HasForeignKey(c => c.RestaurantId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<MenuItem>()
            .HasOne(m => m.Category)
            .WithMany(c => c.MenuItems)
            .HasForeignKey(m => m.CategoryId)
            .OnDelete(DeleteBehavior.Restrict);
        modelBuilder.Entity<MenuItem>()
            .Property(m => m.IsDeleted).HasDefaultValue(false);
        modelBuilder.Entity<MenuItem>()
            .HasQueryFilter(m => !m.IsDeleted && m.RestaurantId == CurrentTenantId);
        modelBuilder.Entity<MenuItem>()
            .HasIndex(m => m.IsAvailable);
        modelBuilder.Entity<MenuItem>()
            .HasOne(m => m.Restaurant)
            .WithMany()
            .HasForeignKey(m => m.RestaurantId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<Order>()
            .Property(o => o.Status).HasConversion<string>();
        modelBuilder.Entity<Order>()
            .HasOne(o => o.CreatedBy)
            .WithMany(u => u.Orders)
            .HasForeignKey(o => o.CreatedById)
            .OnDelete(DeleteBehavior.Restrict);
        modelBuilder.Entity<Order>()
            .Property(o => o.IsDeleted).HasDefaultValue(false);
        modelBuilder.Entity<Order>()
            .HasQueryFilter(o => !o.IsDeleted && o.RestaurantId == CurrentTenantId);
        modelBuilder.Entity<Order>()
            .HasIndex(o => o.Status);
        modelBuilder.Entity<Order>()
            .HasIndex(o => o.PlacedAt);
        modelBuilder.Entity<Order>()
            .HasOne(o => o.Restaurant)
            .WithMany()
            .HasForeignKey(o => o.RestaurantId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<OrderItem>()
            .Property(i => i.IsDeleted).HasDefaultValue(false);
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

        modelBuilder.Entity<AuditLog>()
            .HasQueryFilter(a => a.RestaurantId == CurrentTenantId);

        // One subscription per restaurant. Not tenant-filtered: it is always queried
        // by an explicit RestaurantId (including from the gate, before/at tenant
        // resolution), so a global filter would only get in the way.
        modelBuilder.Entity<Subscription>()
            .HasIndex(s => s.RestaurantId).IsUnique();
        modelBuilder.Entity<Subscription>()
            .Property(s => s.Plan).HasConversion<string>();
        modelBuilder.Entity<Subscription>()
            .Property(s => s.Status).HasConversion<string>();
        modelBuilder.Entity<Subscription>()
            .HasOne(s => s.Restaurant)
            .WithMany()
            .HasForeignKey(s => s.RestaurantId)
            .OnDelete(DeleteBehavior.Cascade);

        // WorkShift — one row per employee per day, grouped by WeekStartDate
        modelBuilder.Entity<WorkShift>()
            .HasQueryFilter(s => s.RestaurantId == CurrentTenantId);
        modelBuilder.Entity<WorkShift>()
            .Property(s => s.DayOfWeek).HasConversion<string>();
        modelBuilder.Entity<WorkShift>()
            .HasOne(s => s.User)
            .WithMany()
            .HasForeignKey(s => s.UserId)
            .OnDelete(DeleteBehavior.Cascade);
        modelBuilder.Entity<WorkShift>()
            .HasOne(s => s.Restaurant)
            .WithMany()
            .HasForeignKey(s => s.RestaurantId)
            .OnDelete(DeleteBehavior.Cascade);
        // Fast "load a whole week" query
        modelBuilder.Entity<WorkShift>()
            .HasIndex(s => new { s.RestaurantId, s.WeekStartDate });
        // Fast "load my week" query (worker view)
        modelBuilder.Entity<WorkShift>()
            .HasIndex(s => new { s.UserId, s.WeekStartDate });

        // ShiftRequest — rest-day and shift-swap requests
        modelBuilder.Entity<ShiftRequest>()
            .HasQueryFilter(r => r.RestaurantId == CurrentTenantId);
        modelBuilder.Entity<ShiftRequest>()
            .Property(r => r.Type).HasConversion<string>();
        modelBuilder.Entity<ShiftRequest>()
            .Property(r => r.Status).HasConversion<string>();
        modelBuilder.Entity<ShiftRequest>()
            .HasOne(r => r.Requester)
            .WithMany()
            .HasForeignKey(r => r.RequesterId)
            .OnDelete(DeleteBehavior.Cascade);
        modelBuilder.Entity<ShiftRequest>()
            .HasOne(r => r.TargetUser)
            .WithMany()
            .HasForeignKey(r => r.TargetUserId)
            .OnDelete(DeleteBehavior.SetNull);
        modelBuilder.Entity<ShiftRequest>()
            .HasOne(r => r.Restaurant)
            .WithMany()
            .HasForeignKey(r => r.RestaurantId)
            .OnDelete(DeleteBehavior.Cascade);
        // Fast "show pending requests" query for the manager panel
        modelBuilder.Entity<ShiftRequest>()
            .HasIndex(r => new { r.RestaurantId, r.Status });
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
                RestaurantId = CurrentTenantId ?? Guid.Empty,
            });
        }

        return await base.SaveChangesAsync(cancellationToken);
    }
}
