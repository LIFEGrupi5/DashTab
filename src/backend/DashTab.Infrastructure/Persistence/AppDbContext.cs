using DashTab.Domain.Entities;

namespace DashTab.Infrastructure.Persistence;

// will extend DbContext once EF Core is added
public class AppDbContext
{
    public List<Order> Orders { get; set; } = [];
}
