using ItiPortal.Domain.Enums;

namespace ItiPortal.Domain.Entities;

public class Exam : BaseEntity
{
    public int CourseId { get; set; }
    public Course Course { get; set; } = null!;

    public ExamType ExamType { get; set; }
    public DateTime ExamDate { get; set; }
    public string? ExamLink { get; set; }
    public string? Location { get; set; }
    public int DurationMinutes { get; set; }

    public bool IsPublished { get; set; }
    public DateTime? PublishedAt { get; set; }
    public Guid? PublishedById { get; set; }

    public string? Notes { get; set; }

    public ICollection<CorrectiveExamStudent> CorrectiveStudents { get; set; } = new List<CorrectiveExamStudent>();
}

public class CorrectiveExamStudent
{
    public int ExamId { get; set; }
    public Exam Exam { get; set; } = null!;

    public Guid StudentId { get; set; }
    public ApplicationUser Student { get; set; } = null!;
}
