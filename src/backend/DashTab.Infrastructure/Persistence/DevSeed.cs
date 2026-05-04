using DashTab.Domain.Entities;
using DashTab.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace DashTab.Infrastructure.Persistence;

public static class DevSeed
{
    private static readonly Guid AdminId   = Guid.Parse("00000000-0000-0000-0000-000000000001");
    private static readonly Guid ManagerId = Guid.Parse("00000000-0000-0000-0000-000000000002");
    private static readonly Guid WaiterId  = Guid.Parse("00000000-0000-0000-0000-000000000003");
    private static readonly Guid KitchenId = Guid.Parse("00000000-0000-0000-0000-000000000004");

    public static async Task RunAsync(AppDbContext db)
    {
        if (await db.Users.AnyAsync()) return;

        var now = DateTime.UtcNow;

        var users = new List<User>
        {
            new() { Id = AdminId,   FullName = "Admin User",   Email = "admin@restaurant.com",   Role = Role.Owner,   IsActive = true, CreatedAt = now, UpdatedAt = now },
            new() { Id = ManagerId, FullName = "John Manager", Email = "manager@restaurant.com", Role = Role.Manager, IsActive = true, CreatedAt = now, UpdatedAt = now },
            new() { Id = WaiterId,  FullName = "Ana Waiter",   Email = "ana@restaurant.com",     Role = Role.Waiter,  IsActive = true, CreatedAt = now, UpdatedAt = now },
            new() { Id = KitchenId, FullName = "Petrit Chef",  Email = "petrit@restaurant.com",  Role = Role.Kitchen, IsActive = true, CreatedAt = now, UpdatedAt = now },
        };
        db.Users.AddRange(users);

        var cats = new Dictionary<string, MenuCategory>
        {
            ["Main Course"] = new() { Id = Guid.NewGuid(), Name = "Main Course", DisplayOrder = 1, CreatedAt = now, UpdatedAt = now },
            ["Appetizer"]   = new() { Id = Guid.NewGuid(), Name = "Appetizer",   DisplayOrder = 2, CreatedAt = now, UpdatedAt = now },
            ["Salad"]       = new() { Id = Guid.NewGuid(), Name = "Salad",       DisplayOrder = 3, CreatedAt = now, UpdatedAt = now },
            ["Dessert"]     = new() { Id = Guid.NewGuid(), Name = "Dessert",     DisplayOrder = 4, CreatedAt = now, UpdatedAt = now },
            ["Beverage"]    = new() { Id = Guid.NewGuid(), Name = "Beverage",    DisplayOrder = 5, CreatedAt = now, UpdatedAt = now },
        };
        db.MenuCategories.AddRange(cats.Values);

        var menuItems = new List<MenuItem>
        {
            new() { Id = Guid.NewGuid(), CategoryId = cats["Main Course"].Id, Name = "Qebapa",         Price = 4.5m,  Description = "Traditional grilled meat", IsAvailable = true, CreatedAt = now, UpdatedAt = now },
            new() { Id = Guid.NewGuid(), CategoryId = cats["Main Course"].Id, Name = "Pljeskavica",    Price = 5m,    Description = "Grilled patty",            IsAvailable = true, CreatedAt = now, UpdatedAt = now },
            new() { Id = Guid.NewGuid(), CategoryId = cats["Main Course"].Id, Name = "Tave Kosi",      Price = 6.5m,  Description = "Lamb with yogurt",         IsAvailable = true, CreatedAt = now, UpdatedAt = now },
            new() { Id = Guid.NewGuid(), CategoryId = cats["Main Course"].Id, Name = "Fergese",        Price = 5.5m,  Description = "Peppers with cheese",      IsAvailable = true, CreatedAt = now, UpdatedAt = now },
            new() { Id = Guid.NewGuid(), CategoryId = cats["Appetizer"].Id,   Name = "Byrek",          Price = 1.2m,  Description = "Cheese or meat pie",       IsAvailable = true, CreatedAt = now, UpdatedAt = now },
            new() { Id = Guid.NewGuid(), CategoryId = cats["Salad"].Id,       Name = "Shopska Salad",  Price = 3.5m,  Description = "Fresh vegetable salad",    IsAvailable = true, CreatedAt = now, UpdatedAt = now },
            new() { Id = Guid.NewGuid(), CategoryId = cats["Dessert"].Id,     Name = "Baklava",        Price = 2m,    Description = "Sweet pastry",             IsAvailable = true, CreatedAt = now, UpdatedAt = now },
            new() { Id = Guid.NewGuid(), CategoryId = cats["Beverage"].Id,    Name = "Turkish Coffee", Price = 1.5m,  Description = "",                         IsAvailable = true, CreatedAt = now, UpdatedAt = now },
            new() { Id = Guid.NewGuid(), CategoryId = cats["Beverage"].Id,    Name = "Raki",           Price = 3m,    Description = "",                         IsAvailable = true, CreatedAt = now, UpdatedAt = now },
            new() { Id = Guid.NewGuid(), CategoryId = cats["Beverage"].Id,    Name = "Ayran",          Price = 0.5m,  Description = "",                         IsAvailable = true, CreatedAt = now, UpdatedAt = now },
        };
        db.MenuItems.AddRange(menuItems);

        var orders = new List<Order>
        {
            new()
            {
                Id = Guid.NewGuid(), OrderNumber = "001", TableLabel = "T-5",
                Status = OrderStatus.New, TotalAmount = 12m,
                CreatedById = WaiterId, CreatedByName = "Ana Waiter",
                PlacedAt = now.AddMinutes(-10), StageEnteredAt = now.AddMinutes(-10),
                CreatedAt = now, UpdatedAt = now,
                Items =
                [
                    new() { Id = Guid.NewGuid(), MenuItemNameSnapshot = "Qebapa",        Quantity = 2, UnitPrice = 4.5m, LineTotal = 9m   },
                    new() { Id = Guid.NewGuid(), MenuItemNameSnapshot = "Turkish Coffee", Quantity = 2, UnitPrice = 1.5m, LineTotal = 3m   },
                ]
            },
            new()
            {
                Id = Guid.NewGuid(), OrderNumber = "002", TableLabel = "T-3",
                Status = OrderStatus.Preparing, TotalAmount = 10m,
                CreatedById = WaiterId, CreatedByName = "Ana Waiter",
                PlacedAt = now.AddMinutes(-32), StageEnteredAt = now.AddMinutes(-11),
                CreatedAt = now, UpdatedAt = now,
                Items =
                [
                    new() { Id = Guid.NewGuid(), MenuItemNameSnapshot = "Tave Kosi",    Quantity = 1, UnitPrice = 6.5m, LineTotal = 6.5m },
                    new() { Id = Guid.NewGuid(), MenuItemNameSnapshot = "Shopska Salad", Quantity = 1, UnitPrice = 3.5m, LineTotal = 3.5m },
                ]
            },
            new()
            {
                Id = Guid.NewGuid(), OrderNumber = "003", TableLabel = "T-7",
                Status = OrderStatus.Ready, TotalAmount = 17.4m,
                CreatedById = WaiterId, CreatedByName = "Ana Waiter",
                PlacedAt = now.AddMinutes(-48), StageEnteredAt = now.AddMinutes(-6),
                CreatedAt = now, UpdatedAt = now,
                Items =
                [
                    new() { Id = Guid.NewGuid(), MenuItemNameSnapshot = "Pljeskavica", Quantity = 3, UnitPrice = 5m,   LineTotal = 15m  },
                    new() { Id = Guid.NewGuid(), MenuItemNameSnapshot = "Byrek",        Quantity = 2, UnitPrice = 1.2m, LineTotal = 2.4m },
                ]
            },
            new()
            {
                Id = Guid.NewGuid(), OrderNumber = "004", TableLabel = "1",
                Status = OrderStatus.New, TotalAmount = 16m,
                CreatedById = WaiterId, CreatedByName = "Ana Waiter",
                PlacedAt = now.AddMinutes(-180), StageEnteredAt = now.AddMinutes(-45),
                CreatedAt = now, UpdatedAt = now,
                Items =
                [
                    new() { Id = Guid.NewGuid(), MenuItemNameSnapshot = "Pljeskavica", Quantity = 1, UnitPrice = 5m,   LineTotal = 5m  },
                    new() { Id = Guid.NewGuid(), MenuItemNameSnapshot = "Fergese",     Quantity = 2, UnitPrice = 5.5m, LineTotal = 11m },
                ]
            },
            new()
            {
                Id = Guid.NewGuid(), OrderNumber = "005", TableLabel = "T-2",
                Status = OrderStatus.Completed, TotalAmount = 10.5m,
                CreatedById = WaiterId, CreatedByName = "Ana Waiter",
                PlacedAt = now.AddHours(-9), StageEnteredAt = now.AddHours(-9),
                CreatedAt = now, UpdatedAt = now,
                Items =
                [
                    new() { Id = Guid.NewGuid(), MenuItemNameSnapshot = "Qebapa",        Quantity = 2, UnitPrice = 4.5m, LineTotal = 9m   },
                    new() { Id = Guid.NewGuid(), MenuItemNameSnapshot = "Turkish Coffee", Quantity = 1, UnitPrice = 1.5m, LineTotal = 1.5m },
                ]
            },
            new()
            {
                Id = Guid.NewGuid(), OrderNumber = "006", TableLabel = "T-4",
                Status = OrderStatus.Completed, TotalAmount = 7m,
                CreatedById = WaiterId, CreatedByName = "Ana Waiter",
                PlacedAt = now.AddHours(-8), StageEnteredAt = now.AddHours(-8),
                CreatedAt = now, UpdatedAt = now,
                Items =
                [
                    new() { Id = Guid.NewGuid(), MenuItemNameSnapshot = "Tave Kosi", Quantity = 1, UnitPrice = 6.5m, LineTotal = 6.5m },
                    new() { Id = Guid.NewGuid(), MenuItemNameSnapshot = "Ayran",     Quantity = 1, UnitPrice = 0.5m, LineTotal = 0.5m },
                ]
            },
        };
        db.Orders.AddRange(orders);

        await db.SaveChangesAsync();
    }
}
