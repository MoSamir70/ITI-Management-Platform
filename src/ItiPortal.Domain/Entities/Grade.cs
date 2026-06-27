namespace ItiPortal.Domain.Entities;

public class Grade : BaseEntity
{
    public Guid StudentId { get; set; }
    public ApplicationUser Student { get; set; } = null!;

    public int CourseId { get; set; }
    public Course Course { get; set; } = null!;

    public int GroupId { get; set; }
    public Group Group { get; set; } = null!;

    public decimal? LabGrade { get; set; }
    public decimal? ExamGrade { get; set; }
    public decimal? TotalGrade { get; set; }
    public decimal? AbsencePercentage { get; set; }

    public bool IsPublished { get; set; }
    public DateTime? PublishedAt { get; set; }
    public Guid? PublishedById { get; set; }
    public ApplicationUser? PublishedBy { get; set; }

    public string? Notes { get; set; }
    public DateTime EnteredAt { get; set; }
    public Guid? EnteredById { get; set; }
}
