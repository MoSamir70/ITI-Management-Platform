using ItiPortal.Domain.Enums;

namespace ItiPortal.Domain.Entities;

public class Attendance : BaseEntity
{
    public Guid StudentId { get; set; }
    public ApplicationUser Student { get; set; } = null!;

    public int CourseId { get; set; }
    public Course Course { get; set; } = null!;

    public int GroupId { get; set; }
    public Group Group { get; set; } = null!;

    public DateTime SessionDate { get; set; }
    public SessionType SessionType { get; set; }
    public int SessionOrdinal { get; set; } = 1;
    public bool IsAbsent { get; set; }

    public int? AbsenceRequestId { get; set; }
    public AbsenceRequest? AbsenceRequest { get; set; }

    public Guid RecordedById { get; set; }
    public string? Notes { get; set; }
    public DateTime RecordedAt { get; set; }
}
