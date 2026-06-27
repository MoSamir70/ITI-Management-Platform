using ItiPortal.Application.Grades;
using ItiPortal.Domain.Entities;
using ItiPortal.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace ItiPortal.Persistence.Grades;

public class GradeService : IGradeService
{
    private readonly AppDbContext _db;
    public GradeService(AppDbContext db) => _db = db;

    public async Task<GradeResult<IReadOnlyList<GradeRowDto>>> ListForCourseAsync(int courseId, Guid actorId, string actorRole, CancellationToken ct)
    {
        if (actorRole == Roles.StudentAffairs)
            return GradeResult<IReadOnlyList<GradeRowDto>>.Fail("forbidden");

        var course = await _db.Courses.Include(c => c.Track).FirstOrDefaultAsync(c => c.Id == courseId, ct);
        if (course is null) return GradeResult<IReadOnlyList<GradeRowDto>>.Fail("not_found");

        if (actorRole == Roles.Supervisor && course.Track.SupervisorId != actorId)
            return GradeResult<IReadOnlyList<GradeRowDto>>.Fail("not_found");

        if (actorRole == Roles.TA)
        {
            var ok = await _db.GroupTAs.AnyAsync(gt => gt.UserId == actorId &&
                _db.Enrollments.Any(e => e.CourseId == courseId && e.GroupId == gt.GroupId), ct);
            if (!ok) return GradeResult<IReadOnlyList<GradeRowDto>>.Fail("not_found");
        }

        var rows = await (
            from e in _db.Enrollments
            where e.CourseId == courseId && e.Status == EnrollmentStatus.Active
            join u in _db.Users on e.StudentId equals u.Id
            join g in _db.Grades.Where(g => g.CourseId == courseId) on e.StudentId equals g.StudentId into gj
            from g in gj.DefaultIfEmpty()
            select new GradeRowDto(
                e.StudentId, u.FullName, courseId, e.GroupId,
                g != null ? g.LabGrade : null, g != null ? g.ExamGrade : null, g != null ? g.TotalGrade : null,
                g != null ? g.AbsencePercentage : null,
                g != null && g.IsPublished, g != null ? g.PublishedAt : null)
        ).ToListAsync(ct);

        return GradeResult<IReadOnlyList<GradeRowDto>>.Ok(rows);
    }

    public Task<GradeResult> SetLabAsync(int courseId, Guid studentId, SetGradeRequest req, Guid actorId, string actorRole, CancellationToken ct)
        => SetComponentAsync(courseId, studentId, actorId, actorRole, lab: req.Value, exam: null, isLab: true, ct);

    public Task<GradeResult> SetExamAsync(int courseId, Guid studentId, SetGradeRequest req, Guid actorId, string actorRole, CancellationToken ct)
        => SetComponentAsync(courseId, studentId, actorId, actorRole, lab: null, exam: req.Value, isLab: false, ct);

    private async Task<GradeResult> SetComponentAsync(int courseId, Guid studentId, Guid actorId, string actorRole, decimal? lab, decimal? exam, bool isLab, CancellationToken ct)
    {
        var course = await _db.Courses.Include(c => c.Track).FirstOrDefaultAsync(c => c.Id == courseId, ct);
        if (course is null) return GradeResult.Fail("not_found");

        if (isLab && course.GradingMode == GradingMode.GradesOnly)
            return GradeResult.Fail("lab_grades_not_applicable_for_grading_mode");

        if (!isLab && actorRole == Roles.TA)
            return GradeResult.Fail("forbidden");

        if (actorRole == Roles.Supervisor && course.Track.SupervisorId != actorId)
            return GradeResult.Fail("not_found");

        if (actorRole == Roles.TA)
        {
            var enrollment = await _db.Enrollments.FirstOrDefaultAsync(e => e.CourseId == courseId && e.StudentId == studentId, ct);
            if (enrollment is null) return GradeResult.Fail("not_found");
            var inGroup = await _db.GroupTAs.AnyAsync(gt => gt.UserId == actorId && gt.GroupId == enrollment.GroupId, ct);
            if (!inGroup) return GradeResult.Fail("not_found");
        }

        var enrollmentExists = await _db.Enrollments.FirstOrDefaultAsync(e => e.CourseId == courseId && e.StudentId == studentId, ct);
        if (enrollmentExists is null) return GradeResult.Fail("student_not_enrolled");

        var grade = await _db.Grades.FirstOrDefaultAsync(g => g.CourseId == courseId && g.StudentId == studentId, ct);
        if (grade is null)
        {
            grade = new Grade
            {
                CourseId = courseId,
                StudentId = studentId,
                GroupId = enrollmentExists.GroupId,
                EnteredAt = DateTime.UtcNow,
                EnteredById = actorId
            };
            _db.Grades.Add(grade);
        }

        if (isLab) grade.LabGrade = lab;
        else grade.ExamGrade = exam;
        grade.TotalGrade = GradeCalculator.Compute(course.GradingMode, grade.LabGrade, grade.ExamGrade);
        grade.EnteredAt = DateTime.UtcNow;
        grade.EnteredById = actorId;

        await _db.SaveChangesAsync(ct);
        return GradeResult.Ok();
    }

    public async Task<GradeResult> PublishAsync(int courseId, Guid actorId, string actorRole, CancellationToken ct)
    {
        var course = await _db.Courses.Include(c => c.Track).FirstOrDefaultAsync(c => c.Id == courseId, ct);
        if (course is null) return GradeResult.Fail("not_found");
        if (actorRole == Roles.Supervisor && course.Track.SupervisorId != actorId)
            return GradeResult.Fail("not_found");

        var enrolledIds = await _db.Enrollments
            .Where(e => e.CourseId == courseId && e.Status == EnrollmentStatus.Active)
            .Select(e => e.StudentId).ToListAsync(ct);

        var gradedIds = await _db.Grades
            .Where(g => g.CourseId == courseId && g.TotalGrade != null)
            .Select(g => g.StudentId).ToListAsync(ct);

        var missing = enrolledIds.Except(gradedIds).ToList();
        if (missing.Count > 0) return GradeResult.Fail("incomplete_grades", missing);

        var grades = await _db.Grades.Where(g => g.CourseId == courseId).ToListAsync(ct);
        var now = DateTime.UtcNow;
        foreach (var g in grades)
        {
            if (!g.IsPublished)
            {
                g.IsPublished = true;
                g.PublishedAt = now;
                g.PublishedById = actorId;
            }
        }

        // Emit GradePublished notifications (consumed by spec 009 module)
        foreach (var sid in enrolledIds)
        {
            _db.Notifications.Add(new Notification
            {
                UserId = sid,
                Title = "Grades published",
                Body = $"Grades for course {course.Name} have been published.",
                Type = NotificationType.GradePublished,
                RelatedEntityId = course.Id.ToString()
            });
        }

        await _db.SaveChangesAsync(ct);
        return GradeResult.Ok();
    }

    public async Task<GradeResult<IReadOnlyList<StudentGradeDto>>> GetStudentGradesAsync(Guid studentId, Guid actorId, string actorRole, CancellationToken ct)
    {
        var isSelf = studentId == actorId;
        if (actorRole == Roles.Student && !isSelf)
            return GradeResult<IReadOnlyList<StudentGradeDto>>.Fail("forbidden");

        if (actorRole == Roles.StudentAffairs)
            return GradeResult<IReadOnlyList<StudentGradeDto>>.Fail("forbidden");

        var q =
            from g in _db.Grades
            where g.StudentId == studentId
            join c in _db.Courses on g.CourseId equals c.Id
            select new { g, c };

        if (actorRole == Roles.Student) q = q.Where(x => x.g.IsPublished);

        if (actorRole == Roles.Supervisor)
            q = q.Where(x => _db.Tracks.Any(t => t.Id == x.c.TrackId && t.SupervisorId == actorId));

        var list = await q
            .Select(x => new StudentGradeDto(x.c.Id, x.c.Name, x.g.LabGrade, x.g.ExamGrade, x.g.TotalGrade, x.g.AbsencePercentage, x.g.PublishedAt))
            .ToListAsync(ct);

        return GradeResult<IReadOnlyList<StudentGradeDto>>.Ok(list);
    }
}
