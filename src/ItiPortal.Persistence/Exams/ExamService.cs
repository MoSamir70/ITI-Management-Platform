using ItiPortal.Application.Exams;
using ItiPortal.Domain.Entities;
using ItiPortal.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace ItiPortal.Persistence.Exams;

public class ExamService : IExamService
{
    private readonly AppDbContext _db;
    public ExamService(AppDbContext db) => _db = db;

    public async Task<ExamResult<ExamDto>> CreateAsync(
        int courseId, CreateExamRequest req, Guid actorId, string actorRole, CancellationToken ct)
    {
        var course = await _db.Courses.Include(c => c.Track).FirstOrDefaultAsync(c => c.Id == courseId, ct);
        if (course is null) return ExamResult<ExamDto>.Fail("not_found");

        if (!CanManageExam(course, actorId, actorRole))
            return ExamResult<ExamDto>.Fail("forbidden");

        var exam = new Exam
        {
            CourseId = courseId,
            ExamType = req.ExamType,
            ExamDate = req.ExamDate,
            ExamLink = req.ExamLink,
            Location = req.Location,
            DurationMinutes = req.DurationMinutes,
            Notes = req.Notes
        };
        _db.Exams.Add(exam);
        await _db.SaveChangesAsync(ct);

        if (req.ExamType == ExamType.Corrective && req.CorrectiveStudentIds?.Count > 0)
        {
            foreach (var sid in req.CorrectiveStudentIds)
                _db.CorrectiveExamStudents.Add(new CorrectiveExamStudent { ExamId = exam.Id, StudentId = sid });
            await _db.SaveChangesAsync(ct);
        }

        return ExamResult<ExamDto>.Ok(await ToDto(exam.Id, ct));
    }

    public async Task<ExamResult<IReadOnlyList<ExamDto>>> ListForCourseAsync(
        int courseId, Guid actorId, string actorRole, CancellationToken ct)
    {
        var course = await _db.Courses.Include(c => c.Track).FirstOrDefaultAsync(c => c.Id == courseId, ct);
        if (course is null) return ExamResult<IReadOnlyList<ExamDto>>.Fail("not_found");

        if (actorRole == Roles.Student)
        {
            // Student sees published exams for courses they're enrolled in
            var enrolled = await _db.Enrollments.AnyAsync(
                e => e.StudentId == actorId && e.CourseId == courseId && e.Status == EnrollmentStatus.Active, ct);
            if (!enrolled) return ExamResult<IReadOnlyList<ExamDto>>.Fail("forbidden");
        }
        else if (actorRole == Roles.StudentAffairs)
        {
            return ExamResult<IReadOnlyList<ExamDto>>.Fail("forbidden");
        }
        else if (actorRole == Roles.Supervisor && course.Track.SupervisorId != actorId)
        {
            return ExamResult<IReadOnlyList<ExamDto>>.Fail("forbidden");
        }
        else if (actorRole == Roles.TA)
        {
            var inGroup = await _db.GroupTAs.AnyAsync(
                gt => gt.UserId == actorId &&
                      _db.Enrollments.Any(e => e.CourseId == courseId && e.GroupId == gt.GroupId), ct);
            if (!inGroup) return ExamResult<IReadOnlyList<ExamDto>>.Fail("forbidden");
        }

        var query = _db.Exams.Where(e => e.CourseId == courseId);
        if (actorRole == Roles.Student) query = query.Where(e => e.IsPublished);

        var ids = await query.Select(e => e.Id).ToListAsync(ct);
        var dtos = new List<ExamDto>();
        foreach (var id in ids) dtos.Add(await ToDto(id, ct));

        return ExamResult<IReadOnlyList<ExamDto>>.Ok(dtos);
    }

    public async Task<ExamResult<ExamDto>> GetAsync(int examId, Guid actorId, string actorRole, CancellationToken ct)
    {
        var exam = await _db.Exams.Include(e => e.Course).ThenInclude(c => c.Track)
            .FirstOrDefaultAsync(e => e.Id == examId, ct);
        if (exam is null) return ExamResult<ExamDto>.Fail("not_found");

        if (actorRole == Roles.StudentAffairs) return ExamResult<ExamDto>.Fail("forbidden");
        if (actorRole == Roles.Student && !exam.IsPublished) return ExamResult<ExamDto>.Fail("not_found");

        return ExamResult<ExamDto>.Ok(await ToDto(examId, ct));
    }

    public async Task<ExamResult> UpdateAsync(
        int examId, UpdateExamRequest req, Guid actorId, string actorRole, CancellationToken ct)
    {
        var exam = await _db.Exams.Include(e => e.Course).ThenInclude(c => c.Track)
            .FirstOrDefaultAsync(e => e.Id == examId, ct);
        if (exam is null) return ExamResult.Fail("not_found");
        if (!CanManageExam(exam.Course, actorId, actorRole)) return ExamResult.Fail("forbidden");
        if (exam.IsPublished) return ExamResult.Fail("already_published");

        if (req.ExamDate.HasValue) exam.ExamDate = req.ExamDate.Value;
        if (req.ExamLink is not null) exam.ExamLink = req.ExamLink;
        if (req.Location is not null) exam.Location = req.Location;
        if (req.DurationMinutes.HasValue) exam.DurationMinutes = req.DurationMinutes.Value;
        if (req.Notes is not null) exam.Notes = req.Notes;

        await _db.SaveChangesAsync(ct);
        return ExamResult.Ok();
    }

    public async Task<ExamResult> PublishAsync(int examId, Guid actorId, string actorRole, CancellationToken ct)
    {
        var exam = await _db.Exams.Include(e => e.Course).ThenInclude(c => c.Track)
            .Include(e => e.CorrectiveStudents)
            .FirstOrDefaultAsync(e => e.Id == examId, ct);
        if (exam is null) return ExamResult.Fail("not_found");
        if (!CanManageExam(exam.Course, actorId, actorRole)) return ExamResult.Fail("forbidden");
        if (exam.IsPublished) return ExamResult.Fail("already_published");

        exam.IsPublished = true;
        exam.PublishedAt = DateTime.UtcNow;
        exam.PublishedById = actorId;
        await _db.SaveChangesAsync(ct);

        // Notify relevant students
        List<Guid> recipientIds;
        var notifType = exam.ExamType == ExamType.Corrective
            ? NotificationType.CorrectiveExam
            : NotificationType.ExamScheduled;

        if (exam.ExamType == ExamType.Corrective)
        {
            recipientIds = exam.CorrectiveStudents.Select(cs => cs.StudentId).ToList();
        }
        else
        {
            recipientIds = await _db.Enrollments
                .Where(e => e.CourseId == exam.CourseId && e.Status == EnrollmentStatus.Active)
                .Select(e => e.StudentId).ToListAsync(ct);
        }

        foreach (var sid in recipientIds)
        {
            _db.Notifications.Add(new Notification
            {
                UserId = sid,
                Title = exam.ExamType == ExamType.Corrective ? "Corrective exam scheduled" : "Exam scheduled",
                Body = $"{exam.Course.Name} exam on {exam.ExamDate:dd MMM yyyy} at {exam.Location ?? exam.ExamLink ?? "TBD"}.",
                Type = notifType,
                RelatedEntityId = exam.Id.ToString()
            });
        }

        await _db.SaveChangesAsync(ct);
        return ExamResult.Ok();
    }

    public async Task<ExamResult<IReadOnlyList<ExamDto>>> GetMyExamsAsync(Guid studentId, CancellationToken ct)
    {
        var enrolledCourseIds = await _db.Enrollments
            .Where(e => e.StudentId == studentId && e.Status == EnrollmentStatus.Active)
            .Select(e => e.CourseId).ToListAsync(ct);

        var correctiveExamIds = await _db.CorrectiveExamStudents
            .Where(cs => cs.StudentId == studentId)
            .Select(cs => cs.ExamId).ToListAsync(ct);

        var examIds = await _db.Exams
            .Where(e => e.IsPublished &&
                (enrolledCourseIds.Contains(e.CourseId) && e.ExamType == ExamType.Regular ||
                 correctiveExamIds.Contains(e.Id)))
            .Select(e => e.Id).ToListAsync(ct);

        var dtos = new List<ExamDto>();
        foreach (var id in examIds) dtos.Add(await ToDto(id, ct));

        return ExamResult<IReadOnlyList<ExamDto>>.Ok(dtos);
    }

    private static bool CanManageExam(Course course, Guid actorId, string actorRole) =>
        actorRole == Roles.TrainingManager ||
        (actorRole == Roles.Supervisor && course.Track.SupervisorId == actorId);

    private async Task<ExamDto> ToDto(int examId, CancellationToken ct)
    {
        var e = await _db.Exams
            .Include(x => x.Course)
            .Include(x => x.CorrectiveStudents)
            .FirstAsync(x => x.Id == examId, ct);

        return new ExamDto(
            e.Id, e.CourseId, e.Course.Name,
            e.ExamType, e.ExamDate, e.ExamLink, e.Location, e.DurationMinutes,
            e.IsPublished, e.PublishedAt, e.Notes,
            e.CorrectiveStudents.Any() ? e.CorrectiveStudents.Select(cs => cs.StudentId).ToList() : null);
    }
}
