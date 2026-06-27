namespace ItiPortal.Domain.Entities;

public class Group : BaseEntity
{
    public int TrackId { get; set; }
    public Track Track { get; set; } = null!;

    public string Name { get; set; } = null!;
    public string? Code { get; set; }
    public bool IsActive { get; set; } = true;

    public ICollection<GroupTA> TAs { get; set; } = new List<GroupTA>();
    public ICollection<ApplicationUser> Students { get; set; } = new List<ApplicationUser>();
}
