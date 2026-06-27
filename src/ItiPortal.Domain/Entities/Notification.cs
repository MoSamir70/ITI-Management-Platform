using ItiPortal.Domain.Enums;

namespace ItiPortal.Domain.Entities;

public class Notification : BaseEntity
{
    public Guid UserId { get; set; }
    public ApplicationUser User { get; set; } = null!;

    public string Title { get; set; } = null!;
    public string Body { get; set; } = null!;
    public NotificationType Type { get; set; }
    public string? RelatedEntityId { get; set; }

    public bool IsRead { get; set; }
    public DateTime? ReadAt { get; set; }
}
