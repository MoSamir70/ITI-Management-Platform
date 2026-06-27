namespace ItiPortal.Domain.Entities;

public class Branch : BaseEntity
{
    public string Name { get; set; } = null!;
    public string Code { get; set; } = null!;
    public bool IsActive { get; set; } = true;
    public Guid? CreatedById { get; set; }
    public ApplicationUser? CreatedBy { get; set; }

    public ICollection<Intake> Intakes { get; set; } = new List<Intake>();
}
