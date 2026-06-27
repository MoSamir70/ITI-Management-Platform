using ItiPortal.Domain.Enums;

namespace ItiPortal.Application.Notifications;

public record NotificationDto(
    int Id, string Title, string Body,
    NotificationType Type, string? RelatedEntityId,
    bool IsRead, DateTime? ReadAt, DateTime CreatedAt);

public record NotificationResult(bool Success, string? ErrorCode = null)
{
    public static NotificationResult Ok() => new(true);
    public static NotificationResult Fail(string code) => new(false, code);
}
