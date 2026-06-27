namespace ItiPortal.Domain.Entities;

public class GroupTA
{
    public int GroupId { get; set; }
    public Group Group { get; set; } = null!;

    public Guid UserId { get; set; }
    public ApplicationUser User { get; set; } = null!;

    public DateTime AssignedAt { get; set; }
    public Guid AssignedById { get; set; }
    public ApplicationUser AssignedBy { get; set; } = null!;
}
