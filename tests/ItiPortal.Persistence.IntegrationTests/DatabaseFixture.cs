using ItiPortal.Persistence;
using ItiPortal.Persistence.Interceptors;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;

namespace ItiPortal.Persistence.IntegrationTests;

public class SqliteFixture : IDisposable
{
    private readonly SqliteConnection _conn;
    private readonly AuditableInterceptor _interceptor = new();

    public SqliteFixture()
    {
        _conn = new SqliteConnection("DataSource=:memory:");
        _conn.Open();
        using var cmd = _conn.CreateCommand();
        cmd.CommandText = "PRAGMA foreign_keys = ON;";
        cmd.ExecuteNonQuery();
    }

    public AppDbContext NewContext()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseSqlite(_conn)
            .AddInterceptors(_interceptor)
            .Options;
        var ctx = new AppDbContext(options);
        ctx.Database.EnsureCreated();
        return ctx;
    }

    public void Dispose() => _conn.Dispose();
}
