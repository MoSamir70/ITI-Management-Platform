namespace ItiPortal.Application.Notifications;

public interface INotificationService
{
    Task<IReadOnlyList<NotificationDto>> GetMyNotificationsAsync(Guid userId, bool unreadOnly, CancellationToken ct);
    Task<NotificationResult> MarkReadAsync(int notificationId, Guid userId, CancellationToken ct);
    Task<NotificationResult> MarkAllReadAsync(Guid userId, CancellationToken ct);
}
