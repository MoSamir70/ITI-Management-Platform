using ItiPortal.Domain.Enums;

namespace ItiPortal.Domain.Entities;

public class Course : BaseEntity
{
    public int TrackId { get; set; }
    public Track Track { get; set; } = null!;

    public string Name { get; set; } = null!;
    public string Code { get; set; } = null!;
    public string? InstructorName { get; set; }

    public int LectureHours { get; set; }
    public int LabHours { get; set; }
    public int SelfStudyHours { get; set; }

    public GradingMode GradingMode { get; set; }
    public bool CertificateKpiEnabled { get; set; }
    public bool FreelanceKpiEnabled { get; set; }
    public bool HasExam { get; set; }
    public EntityStatus Status { get; set; } = EntityStatus.Active;
}
