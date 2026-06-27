using ItiPortal.Domain.Enums;

namespace ItiPortal.Domain.Entities;

public class Track : BaseEntity
{
    public int IntakeId { get; set; }
    public Intake Intake { get; set; } = null!;

    public string Name { get; set; } = null!;
    public string Code { get; set; } = null!;

    public Guid SupervisorId { get; set; }
    public ApplicationUser Supervisor { get; set; } = null!;

    public bool CertificateKpiEnabled { get; set; }
    public bool FreelanceKpiEnabled { get; set; }
    public EntityStatus Status { get; set; } = EntityStatus.Active;

    public ICollection<Group> Groups { get; set; } = new List<Group>();
    public ICollection<Course> Courses { get; set; } = new List<Course>();
}
