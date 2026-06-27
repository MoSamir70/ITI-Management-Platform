using ItiPortal.Domain.Enums;

namespace ItiPortal.Domain.Entities;

public class StudentCourseEnrollment
{
    public Guid StudentId { get; set; }
    public ApplicationUser Student { get; set; } = null!;

    public int CourseId { get; set; }
    public Course Course { get; set; } = null!;

    public int GroupId { get; set; }
    public Group Group { get; set; } = null!;

    public DateTime EnrolledAt { get; set; }
    public EnrollmentStatus Status { get; set; } = EnrollmentStatus.Active;
}
