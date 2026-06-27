using ItiPortal.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.ChangeTracking;
using Microsoft.EntityFrameworkCore.Diagnostics;

namespace ItiPortal.Persistence.Interceptors;

public class AuditableInterceptor : SaveChangesInterceptor
{
    public override InterceptionResult<int> SavingChanges(
        DbContextEventData eventData,
        InterceptionResult<int> result)
    {
        UpdateTimestamps(eventData.Context);
        return base.SavingChanges(eventData, result);
    }

    public override ValueTask<InterceptionResult<int>> SavingChangesAsync(
        DbContextEventData eventData,
        InterceptionResult<int> result,
        CancellationToken cancellationToken = default)
    {
        UpdateTimestamps(eventData.Context);
        return base.SavingChangesAsync(eventData, result, cancellationToken);
    }

    private static void UpdateTimestamps(DbContext? ctx)
    {
        if (ctx is null) return;
        var now = DateTime.UtcNow;
        foreach (var entry in ctx.ChangeTracker.Entries())
        {
            if (entry.Entity is BaseEntity be)
            {
                if (entry.State == EntityState.Added)
                {
                    be.CreatedAt = now;
                    be.UpdatedAt = now;
                    if (be.RowVersion.Length == 0)
                        be.RowVersion = Guid.NewGuid().ToByteArray();
                }
                else if (entry.State == EntityState.Modified)
                {
                    be.UpdatedAt = now;
                    be.RowVersion = Guid.NewGuid().ToByteArray();
                }
            }
            else if (entry.Entity is ApplicationUser u)
            {
                if (entry.State == EntityState.Added)
                {
                    u.CreatedAt = now;
                    u.UpdatedAt = now;
                }
                else if (entry.State == EntityState.Modified)
                {
                    u.UpdatedAt = now;
                }
            }
        }
    }
}
