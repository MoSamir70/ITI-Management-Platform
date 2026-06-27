namespace ItiPortal.Domain.Entities;

public class Intake : BaseEntity
{
    public int BranchId { get; set; }
    public Branch Branch { get; set; } = null!;

    public string Name { get; set; } = null!;
    public int Number { get; set; }
    public DateTime StartDate { get; set; }
    public DateTime EndDate { get; set; }
    public bool IsActive { get; set; } = true;

    public ICollection<Track> Tracks { get; set; } = new List<Track>();
}
