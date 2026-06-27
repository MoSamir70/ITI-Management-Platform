using ItiPortal.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace ItiPortal.Persistence.Configurations;

internal static class Common
{
    public static void Audit<T>(EntityTypeBuilder<T> b) where T : BaseEntity
    {
        b.Property(x => x.CreatedAt).IsRequired();
        b.Property(x => x.UpdatedAt).IsRequired();
        b.Property(x => x.RowVersion).IsConcurrencyToken().IsRequired();
    }
}

public class BranchConfig : IEntityTypeConfiguration<Branch>
{
    public void Configure(EntityTypeBuilder<Branch> b)
    {
        b.ToTable("Branches");
        b.HasKey(x => x.Id);
        b.Property(x => x.Name).HasMaxLength(200).IsRequired();
        b.Property(x => x.Code).HasMaxLength(50).IsRequired();
        b.HasIndex(x => x.Code).IsUnique();
        b.HasOne(x => x.CreatedBy).WithMany().HasForeignKey(x => x.CreatedById)
            .OnDelete(DeleteBehavior.Restrict);
        Common.Audit(b);
    }
}

public class IntakeConfig : IEntityTypeConfiguration<Intake>
{
    public void Configure(EntityTypeBuilder<Intake> b)
    {
        b.ToTable("Intakes");
        b.HasKey(x => x.Id);
        b.Property(x => x.Name).HasMaxLength(100).IsRequired();
        b.HasOne(x => x.Branch).WithMany(x => x.Intakes).HasForeignKey(x => x.BranchId)
            .OnDelete(DeleteBehavior.Restrict);
        b.HasIndex(x => new { x.BranchId, x.Number }).IsUnique();
        Common.Audit(b);
    }
}

public class TrackConfig : IEntityTypeConfiguration<Track>
{
    public void Configure(EntityTypeBuilder<Track> b)
    {
        b.ToTable("Tracks");
        b.HasKey(x => x.Id);
        b.Property(x => x.Name).HasMaxLength(200).IsRequired();
        b.Property(x => x.Code).HasMaxLength(50).IsRequired();
        b.Property(x => x.Status).HasConversion<string>().HasMaxLength(20);
        b.HasOne(x => x.Intake).WithMany(x => x.Tracks).HasForeignKey(x => x.IntakeId)
            .OnDelete(DeleteBehavior.Restrict);
        b.HasOne(x => x.Supervisor).WithMany().HasForeignKey(x => x.SupervisorId)
            .OnDelete(DeleteBehavior.Restrict);
        b.HasIndex(x => new { x.IntakeId, x.SupervisorId }).IsUnique();
        Common.Audit(b);
    }
}

public class GroupConfig : IEntityTypeConfiguration<Group>
{
    public void Configure(EntityTypeBuilder<Group> b)
    {
        b.ToTable("Groups");
        b.HasKey(x => x.Id);
        b.Property(x => x.Name).HasMaxLength(100).IsRequired();
        b.Property(x => x.Code).HasMaxLength(50);
        b.HasOne(x => x.Track).WithMany(x => x.Groups).HasForeignKey(x => x.TrackId)
            .OnDelete(DeleteBehavior.Restrict);
        b.HasIndex(x => new { x.TrackId, x.Name }).IsUnique();
        Common.Audit(b);
    }
}

public class GroupTAConfig : IEntityTypeConfiguration<GroupTA>
{
    public void Configure(EntityTypeBuilder<GroupTA> b)
    {
        b.ToTable("GroupTAs");
        b.HasKey(x => new { x.GroupId, x.UserId });
        b.HasOne(x => x.Group).WithMany(x => x.TAs).HasForeignKey(x => x.GroupId)
            .OnDelete(DeleteBehavior.Restrict);
        b.HasOne(x => x.User).WithMany().HasForeignKey(x => x.UserId)
            .OnDelete(DeleteBehavior.Restrict);
        b.HasOne(x => x.AssignedBy).WithMany().HasForeignKey(x => x.AssignedById)
            .OnDelete(DeleteBehavior.Restrict);
    }
}

public class ApplicationUserConfig : IEntityTypeConfiguration<ApplicationUser>
{
    public void Configure(EntityTypeBuilder<ApplicationUser> b)
    {
        b.Property(x => x.FullName).HasMaxLength(200).IsRequired();
        b.Property(x => x.NationalId).HasMaxLength(20);
        b.Property(x => x.Gender).HasMaxLength(10);
        b.Property(x => x.PhotoUrl).HasMaxLength(500);
        b.HasIndex(x => x.NationalId).IsUnique().HasFilter("[NationalId] IS NOT NULL");
        b.HasOne(x => x.Group).WithMany(x => x.Students).HasForeignKey(x => x.GroupId)
            .OnDelete(DeleteBehavior.Restrict);
        b.HasOne(x => x.CreatedBy).WithMany().HasForeignKey(x => x.CreatedById)
            .OnDelete(DeleteBehavior.Restrict);
    }
}

public class CourseConfig : IEntityTypeConfiguration<Course>
{
    public void Configure(EntityTypeBuilder<Course> b)
    {
        b.ToTable("Courses");
        b.HasKey(x => x.Id);
        b.Property(x => x.Name).HasMaxLength(200).IsRequired();
        b.Property(x => x.Code).HasMaxLength(50).IsRequired();
        b.Property(x => x.InstructorName).HasMaxLength(200);
        b.Property(x => x.GradingMode).HasConversion<string>().HasMaxLength(30);
        b.Property(x => x.Status).HasConversion<string>().HasMaxLength(20);
        b.HasOne(x => x.Track).WithMany(x => x.Courses).HasForeignKey(x => x.TrackId)
            .OnDelete(DeleteBehavior.Restrict);
        Common.Audit(b);
    }
}

public class EnrollmentConfig : IEntityTypeConfiguration<StudentCourseEnrollment>
{
    public void Configure(EntityTypeBuilder<StudentCourseEnrollment> b)
    {
        b.ToTable("StudentCourseEnrollments");
        b.HasKey(x => new { x.StudentId, x.CourseId });
        b.Property(x => x.Status).HasConversion<string>().HasMaxLength(20);
        b.HasOne(x => x.Student).WithMany().HasForeignKey(x => x.StudentId)
            .OnDelete(DeleteBehavior.Restrict);
        b.HasOne(x => x.Course).WithMany().HasForeignKey(x => x.CourseId)
            .OnDelete(DeleteBehavior.Restrict);
        b.HasOne(x => x.Group).WithMany().HasForeignKey(x => x.GroupId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}

public class GradeConfig : IEntityTypeConfiguration<Grade>
{
    public void Configure(EntityTypeBuilder<Grade> b)
    {
        b.ToTable("Grades");
        b.HasKey(x => x.Id);
        b.Property(x => x.LabGrade).HasPrecision(5, 2);
        b.Property(x => x.ExamGrade).HasPrecision(5, 2);
        b.Property(x => x.TotalGrade).HasPrecision(5, 2);
        b.Property(x => x.AbsencePercentage).HasPrecision(5, 2);
        b.Property(x => x.Notes).HasMaxLength(500);
        b.HasOne(x => x.Student).WithMany().HasForeignKey(x => x.StudentId)
            .OnDelete(DeleteBehavior.Restrict);
        b.HasOne(x => x.Course).WithMany().HasForeignKey(x => x.CourseId)
            .OnDelete(DeleteBehavior.Restrict);
        b.HasOne(x => x.Group).WithMany().HasForeignKey(x => x.GroupId)
            .OnDelete(DeleteBehavior.Restrict);
        b.HasOne(x => x.PublishedBy).WithMany().HasForeignKey(x => x.PublishedById)
            .OnDelete(DeleteBehavior.Restrict);
        b.HasIndex(x => new { x.StudentId, x.CourseId }).IsUnique();
        Common.Audit(b);
    }
}

public class AttendanceConfig : IEntityTypeConfiguration<Attendance>
{
    public void Configure(EntityTypeBuilder<Attendance> b)
    {
        b.ToTable("Attendance");
        b.HasKey(x => x.Id);
        b.Property(x => x.SessionType).HasConversion<string>().HasMaxLength(20);
        b.Property(x => x.Notes).HasMaxLength(300);
        b.HasOne(x => x.Student).WithMany().HasForeignKey(x => x.StudentId)
            .OnDelete(DeleteBehavior.Restrict);
        b.HasOne(x => x.Course).WithMany().HasForeignKey(x => x.CourseId)
            .OnDelete(DeleteBehavior.Restrict);
        b.HasOne(x => x.Group).WithMany().HasForeignKey(x => x.GroupId)
            .OnDelete(DeleteBehavior.Restrict);
        b.HasOne(x => x.AbsenceRequest).WithMany().HasForeignKey(x => x.AbsenceRequestId)
            .OnDelete(DeleteBehavior.SetNull);
        b.HasIndex(x => new { x.StudentId, x.CourseId, x.SessionDate, x.SessionType, x.SessionOrdinal }).IsUnique();
        Common.Audit(b);
    }
}

public class AbsenceRequestConfig : IEntityTypeConfiguration<AbsenceRequest>
{
    public void Configure(EntityTypeBuilder<AbsenceRequest> b)
    {
        b.ToTable("AbsenceRequests");
        b.HasKey(x => x.Id);
        b.Property(x => x.Reason).HasMaxLength(1000).IsRequired();
        b.Property(x => x.Status).HasConversion<string>().HasMaxLength(20);
        b.Property(x => x.ReviewNote).HasMaxLength(500);
        b.HasOne(x => x.Student).WithMany().HasForeignKey(x => x.StudentId)
            .OnDelete(DeleteBehavior.Restrict);
        b.HasOne(x => x.ReviewedBy).WithMany().HasForeignKey(x => x.ReviewedById)
            .OnDelete(DeleteBehavior.Restrict);
        Common.Audit(b);
    }
}

public class ExamConfig : IEntityTypeConfiguration<Exam>
{
    public void Configure(EntityTypeBuilder<Exam> b)
    {
        b.ToTable("Exams");
        b.HasKey(x => x.Id);
        b.Property(x => x.ExamType).HasConversion<string>().HasMaxLength(20);
        b.Property(x => x.ExamLink).HasMaxLength(500);
        b.Property(x => x.Location).HasMaxLength(200);
        b.Property(x => x.Notes).HasMaxLength(500);
        b.HasOne(x => x.Course).WithMany().HasForeignKey(x => x.CourseId)
            .OnDelete(DeleteBehavior.Restrict);
        Common.Audit(b);
    }
}

public class CorrectiveExamStudentConfig : IEntityTypeConfiguration<CorrectiveExamStudent>
{
    public void Configure(EntityTypeBuilder<CorrectiveExamStudent> b)
    {
        b.ToTable("CorrectiveExamStudents");
        b.HasKey(x => new { x.ExamId, x.StudentId });
        b.HasOne(x => x.Exam).WithMany(x => x.CorrectiveStudents).HasForeignKey(x => x.ExamId)
            .OnDelete(DeleteBehavior.Cascade);
        b.HasOne(x => x.Student).WithMany().HasForeignKey(x => x.StudentId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}

public class KpiConfig : IEntityTypeConfiguration<Kpi>
{
    public void Configure(EntityTypeBuilder<Kpi> b)
    {
        b.ToTable("KPIs");
        b.HasKey(x => x.Id);
        b.Property(x => x.KpiType).HasConversion<string>().HasMaxLength(20);
        b.Property(x => x.Status).HasConversion<string>().HasMaxLength(20);
        b.Property(x => x.Title).HasMaxLength(300).IsRequired();
        b.Property(x => x.IssuingBody).HasMaxLength(200);
        b.Property(x => x.Platform).HasMaxLength(100);
        b.Property(x => x.ClientContact).HasMaxLength(300);
        b.Property(x => x.ProjectDescription).HasMaxLength(2000);
        b.Property(x => x.FileUrl).HasMaxLength(500).IsRequired();
        b.Property(x => x.ReviewNote).HasMaxLength(500);
        b.Property(x => x.AmountEarned).HasPrecision(10, 2);
        b.HasOne(x => x.Student).WithMany().HasForeignKey(x => x.StudentId)
            .OnDelete(DeleteBehavior.Restrict);
        b.HasOne(x => x.Track).WithMany().HasForeignKey(x => x.TrackId)
            .OnDelete(DeleteBehavior.Restrict);
        b.HasOne(x => x.Course).WithMany().HasForeignKey(x => x.CourseId)
            .OnDelete(DeleteBehavior.Restrict);
        Common.Audit(b);
    }
}

public class NotificationConfig : IEntityTypeConfiguration<Notification>
{
    public void Configure(EntityTypeBuilder<Notification> b)
    {
        b.ToTable("Notifications");
        b.HasKey(x => x.Id);
        b.Property(x => x.Title).HasMaxLength(200).IsRequired();
        b.Property(x => x.Body).HasMaxLength(2000).IsRequired();
        b.Property(x => x.Type).HasConversion<string>().HasMaxLength(50);
        b.Property(x => x.RelatedEntityId).HasMaxLength(100);
        b.HasOne(x => x.User).WithMany().HasForeignKey(x => x.UserId)
            .OnDelete(DeleteBehavior.Cascade);
        b.HasIndex(x => new { x.UserId, x.IsRead, x.CreatedAt });
        Common.Audit(b);
    }
}

public class RefreshTokenConfig : IEntityTypeConfiguration<RefreshToken>
{
    public void Configure(EntityTypeBuilder<RefreshToken> b)
    {
        b.ToTable("RefreshTokens");
        b.HasKey(x => x.Id);
        b.Property(x => x.TokenHash).HasMaxLength(200).IsRequired();
        b.Property(x => x.ReplacedByTokenHash).HasMaxLength(200);
        b.Property(x => x.CreatedByIp).HasMaxLength(64);
        b.HasOne(x => x.User).WithMany().HasForeignKey(x => x.UserId)
            .OnDelete(DeleteBehavior.Cascade);
        b.HasIndex(x => x.TokenHash).IsUnique();
        Common.Audit(b);
    }
}
