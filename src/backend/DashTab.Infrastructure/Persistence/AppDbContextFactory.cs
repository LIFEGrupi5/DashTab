using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;

namespace DashTab.Infrastructure.Persistence;

// Used by `dotnet ef` at design time so migrations can be generated
// without needing the full API startup.
public class AppDbContextFactory : IDesignTimeDbContextFactory<DashTabDbContext>
{
    public DashTabDbContext CreateDbContext(string[] args)
    {
        var options = new DbContextOptionsBuilder<DashTabDbContext>()
            .UseNpgsql("Host=localhost;Port=5432;Database=dashtab;Username=dashtab;Password=dashtab_secret")
            .UseSnakeCaseNamingConvention()
            .Options;
        return new DashTabDbContext(options);
    }
}
