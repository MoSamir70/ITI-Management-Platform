using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;

namespace ItiPortal.Persistence;

public class AppDbContextFactory : IDesignTimeDbContextFactory<AppDbContext>
{
    public AppDbContext CreateDbContext(string[] args)
    {
        var connectionString = Environment.GetEnvironmentVariable("ITI_CONNECTION")
            ?? "Server=(localdb)\\MSSQLLocalDB;Database=ItiPortal;Trusted_Connection=True;MultipleActiveResultSets=true;TrustServerCertificate=true";

        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseSqlServer(connectionString, b => b.MigrationsAssembly(typeof(AppDbContext).Assembly.FullName))
            .Options;

        return new AppDbContext(options);
    }
}
