using ItiPortal.Application.Notifications;
using Microsoft.EntityFrameworkCore;

namespace ItiPortal.Persistence.Notifications;

public class NotificationService : INotificationService
{
    private readonly AppDbContext _db;
    public NotificationService(AppDbContext db) => _db = db;

    public async Task<IReadOnlyList<NotificationDto>> GetMyNotificationsAsync(
        Guid userId, bool unreadOnly, CancellationToken ct)
    {
        var q = _db.Notifications.Where(n => n.UserId == userId);
        if (unreadOnly) q = q.Where(n => !n.IsRead);

        return await q
            .OrderByDescending(n => n.CreatedAt)
            .Select(n => new NotificationDto(
                n.Id, n.Title, n.Body, n.Type, n.RelatedEntityId,
                n.IsRead, n.ReadAt, n.CreatedAt))
            .ToListAsync(ct);
    }

    public async Task<NotificationResult> MarkReadAsync(int notificationId, Guid userId, CancellationToken ct)
    {
        var notif = await _db.Notifications.FirstOrDefaultAsync(
            n => n.Id == notificationId && n.UserId == userId, ct);
        if (notif is null) return NotificationResult.Fail("not_found");

        if (!notif.IsRead)
        {
            notif.IsRead = true;
            notif.ReadAt = DateTime.UtcNow;
            await _db.SaveChangesAsync(ct);
        }
        return NotificationResult.Ok();
    }

    public async Task<NotificationResult> MarkAllReadAsync(Guid userId, CancellationToken ct)
    {
        var unread = await _db.Notifications
            .Where(n => n.UserId == userId && !n.IsRead).ToListAsync(ct);

        var now = DateTime.UtcNow;
        foreach (var n in unread) { n.IsRead = true; n.ReadAt = now; }
        if (unread.Count > 0) await _db.SaveChangesAsync(ct);

        return NotificationResult.Ok();
    }
}
