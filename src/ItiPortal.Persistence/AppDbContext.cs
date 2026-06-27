using ItiPortal.Domain.Entities;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;

namespace ItiPortal.Persistence;

public class AppDbContext : IdentityDbContext<ApplicationUser, ApplicationRole, Guid>
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<Branch> Branches => Set<Branch>();
    public DbSet<Intake> Intakes => Set<Intake>();
    public DbSet<Track> Tracks => Set<Track>();
    public DbSet<Group> Groups => Set<Group>();
    public DbSet<GroupTA> GroupTAs => Set<GroupTA>();
    public DbSet<Course> Courses => Set<Course>();
    public DbSet<StudentCourseEnrollment> Enrollments => Set<StudentCourseEnrollment>();
    public DbSet<Grade> Grades => Set<Grade>();
    public DbSet<Attendance> Attendances => Set<Attendance>();
    public DbSet<AbsenceRequest> AbsenceRequests => Set<AbsenceRequest>();
    public DbSet<Exam> Exams => Set<Exam>();
    public DbSet<CorrectiveExamStudent> CorrectiveExamStudents => Set<CorrectiveExamStudent>();
    public DbSet<Kpi> Kpis => Set<Kpi>();
    public DbSet<Notification> Notifications => Set<Notification>();
    public DbSet<RefreshToken> RefreshTokens => Set<RefreshToken>();

    protected override void OnModelCreating(ModelBuilder b)
    {
        base.OnModelCreating(b);
        b.ApplyConfigurationsFromAssembly(typeof(AppDbContext).Assembly);
    }
}
