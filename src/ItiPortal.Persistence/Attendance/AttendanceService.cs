using System.Text.Json;
using ItiPortal.Application.Attendance;
using ItiPortal.Domain.Entities;
using ItiPortal.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace ItiPortal.Persistence.Attendances;

public class AttendanceService : IAttendanceService
{
    private readonly AppDbContext _db;
    public AttendanceService(AppDbContext db) => _db = db;

    // -----------------------------------------------------------------------
    // Record session attendance (TA only, scoped to their groups)
    // -----------------------------------------------------------------------
    public async Task<AttendanceResult> RecordSessionAsync(
        int courseId, int groupId, RecordSessionRequest req,
        Guid actorId, string actorRole, CancellationToken ct)
    {
        if (actorRole != Roles.TA && actorRole != Roles.Supervisor && actorRole != Roles.TrainingManager)
            return AttendanceResult.Fail("forbidden");

        if (actorRole == Roles.TA)
        {
            var inGroup = await _db.GroupTAs.AnyAsync(gt => gt.UserId == actorId && gt.GroupId == groupId, ct);
            if (!inGroup) return AttendanceResult.Fail("forbidden");
        }

        if (actorRole == Roles.Supervisor)
        {
            var ok = await _db.Courses.AnyAsync(c => c.Id == courseId && c.Track.SupervisorId == actorId, ct);
            if (!ok) return AttendanceResult.Fail("forbidden");
        }

        var course = await _db.Courses.FirstOrDefaultAsync(c => c.Id == courseId, ct);
        if (course is null) return AttendanceResult.Fail("not_found");

        var date = req.SessionDate.Date;
        var now = DateTime.UtcNow;

        // Upsert per-student records
        foreach (var entry in req.Entries)
        {
            var existing = await _db.Attendances.FirstOrDefaultAsync(
                a => a.CourseId == courseId && a.GroupId == groupId &&
                     a.StudentId == entry.StudentId &&
                     a.SessionDate == date && a.SessionOrdinal == req.SessionOrdinal, ct);

            if (existing is null)
            {
                _db.Attendances.Add(new Domain.Entities.Attendance
                {
                    StudentId = entry.StudentId,
                    CourseId = courseId,
                    GroupId = groupId,
                    SessionDate = date,
                    SessionType = req.SessionType,
                    SessionOrdinal = req.SessionOrdinal,
                    IsAbsent = entry.IsAbsent,
                    Notes = entry.Notes,
                    RecordedById = actorId,
                    RecordedAt = now
                });
            }
            else
            {
                existing.IsAbsent = entry.IsAbsent;
                existing.Notes = entry.Notes;
                existing.RecordedById = actorId;
                existing.RecordedAt = now;
            }
        }

        await _db.SaveChangesAsync(ct);

        // Refresh absence percentages on related grades
        await RefreshAbsencePercentagesAsync(courseId, groupId, ct);

        return AttendanceResult.Ok();
    }

    // -----------------------------------------------------------------------
    // List sessions (dates recorded for a course+group)
    // -----------------------------------------------------------------------
    public async Task<AttendanceResult<IReadOnlyList<SessionSummaryDto>>> ListSessionsAsync(
        int courseId, int groupId, Guid actorId, string actorRole, CancellationToken ct)
    {
        if (!await CanViewCourseAttendance(courseId, groupId, actorId, actorRole, ct))
            return AttendanceResult<IReadOnlyList<SessionSummaryDto>>.Fail("forbidden");

        var rows = await _db.Attendances
            .Where(a => a.CourseId == courseId && a.GroupId == groupId)
            .GroupBy(a => new { a.SessionDate, a.SessionType, a.SessionOrdinal })
            .Select(g => new SessionSummaryDto(
                g.Key.SessionDate, g.Key.SessionType, g.Key.SessionOrdinal,
                g.Count(), g.Count(a => a.IsAbsent)))
            .OrderBy(s => s.SessionDate).ThenBy(s => s.SessionOrdinal)
            .ToListAsync(ct);

        return AttendanceResult<IReadOnlyList<SessionSummaryDto>>.Ok(rows);
    }

    // -----------------------------------------------------------------------
    // Get per-student detail for one session
    // -----------------------------------------------------------------------
    public async Task<AttendanceResult<IReadOnlyList<AttendanceRowDto>>> GetSessionAttendanceAsync(
        int courseId, int groupId, DateTime date, int ordinal, Guid actorId, string actorRole, CancellationToken ct)
    {
        if (!await CanViewCourseAttendance(courseId, groupId, actorId, actorRole, ct))
            return AttendanceResult<IReadOnlyList<AttendanceRowDto>>.Fail("forbidden");

        var sessionDate = date.Date;
        var rows = await (
            from a in _db.Attendances
            where a.CourseId == courseId && a.GroupId == groupId &&
                  a.SessionDate == sessionDate && a.SessionOrdinal == ordinal
            join u in _db.Users on a.StudentId equals u.Id
            select new AttendanceRowDto(
                a.StudentId, u.FullName,
                a.SessionDate, a.SessionType, a.SessionOrdinal,
                a.IsAbsent, a.AbsenceRequestId != null, a.Notes)
        ).ToListAsync(ct);

        return AttendanceResult<IReadOnlyList<AttendanceRowDto>>.Ok(rows);
    }

    // -----------------------------------------------------------------------
    // Student's own attendance across courses
    // -----------------------------------------------------------------------
    public async Task<AttendanceResult<IReadOnlyList<StudentAttendanceSummaryDto>>> GetStudentAttendanceAsync(
        Guid studentId, Guid actorId, string actorRole, CancellationToken ct)
    {
        var isSelf = studentId == actorId;
        if (actorRole == Roles.Student && !isSelf)
            return AttendanceResult<IReadOnlyList<StudentAttendanceSummaryDto>>.Fail("forbidden");
        if (actorRole == Roles.StudentAffairs)
            return AttendanceResult<IReadOnlyList<StudentAttendanceSummaryDto>>.Fail("forbidden");

        var q = _db.Attendances.Where(a => a.StudentId == studentId);

        if (actorRole == Roles.Supervisor)
            q = q.Where(a => _db.Courses.Any(c => c.Id == a.CourseId && c.Track.SupervisorId == actorId));

        if (actorRole == Roles.TA)
            q = q.Where(a => _db.GroupTAs.Any(gt => gt.UserId == actorId && gt.GroupId == a.GroupId));

        var rows = await (
            from a in q
            join c in _db.Courses on a.CourseId equals c.Id
            group new { a, c } by new { a.CourseId, c.Name } into grp
            select new StudentAttendanceSummaryDto(
                grp.Key.CourseId,
                grp.Key.Name,
                grp.Count(),
                grp.Count(x => x.a.IsAbsent),
                grp.Count(x => x.a.IsAbsent && x.a.AbsenceRequestId != null),
                grp.Count() == 0 ? 0m :
                    grp.Count(x => x.a.IsAbsent && x.a.AbsenceRequestId == null) * 100m / grp.Count())
        ).ToListAsync(ct);

        return AttendanceResult<IReadOnlyList<StudentAttendanceSummaryDto>>.Ok(rows);
    }

    // -----------------------------------------------------------------------
    // Submit absence excuse request (Student)
    // -----------------------------------------------------------------------
    public async Task<AttendanceResult<int>> SubmitAbsenceRequestAsync(
        CreateAbsenceRequestRequest req, Guid studentId, CancellationToken ct)
    {
        var dates = req.RequestedDates.Select(d => d.Date).Distinct().OrderBy(d => d).ToList();
        var request = new AbsenceRequest
        {
            StudentId = studentId,
            RequestedDatesJson = JsonSerializer.Serialize(dates),
            Reason = req.Reason,
            Status = AbsenceRequestStatus.Pending,
            SubmittedAt = DateTime.UtcNow
        };
        _db.AbsenceRequests.Add(request);
        await _db.SaveChangesAsync(ct);
        return AttendanceResult<int>.Ok(request.Id);
    }

    // -----------------------------------------------------------------------
    // List absence requests (Supervisor sees their-track students; TM sees all)
    // -----------------------------------------------------------------------
    public async Task<AttendanceResult<IReadOnlyList<AbsenceRequestDto>>> ListAbsenceRequestsAsync(
        Guid actorId, string actorRole, CancellationToken ct)
    {
        if (actorRole == Roles.Student || actorRole == Roles.StudentAffairs || actorRole == Roles.TA)
            return AttendanceResult<IReadOnlyList<AbsenceRequestDto>>.Fail("forbidden");

        IQueryable<AbsenceRequest> q = _db.AbsenceRequests.Include(r => r.Student);

        if (actorRole == Roles.Supervisor)
        {
            // Supervisor sees requests for students enrolled in their tracks
            var supervisorStudentIds = _db.Enrollments
                .Where(e => _db.Courses.Any(c => c.Id == e.CourseId && c.Track.SupervisorId == actorId))
                .Select(e => e.StudentId);
            q = q.Where(r => supervisorStudentIds.Contains(r.StudentId));
        }

        var raw = await q.OrderByDescending(r => r.SubmittedAt).ToListAsync(ct);
        var list = raw.Select(r => new AbsenceRequestDto(
                r.Id, r.StudentId, r.Student.FullName,
                JsonSerializer.Deserialize<List<DateTime>>(r.RequestedDatesJson) ?? new(),
                r.Reason, r.Status,
                r.ReviewedById, r.ReviewedAt, r.ReviewNote,
                r.SubmittedAt))
            .ToList();

        return AttendanceResult<IReadOnlyList<AbsenceRequestDto>>.Ok(list);
    }

    // -----------------------------------------------------------------------
    // Review absence request (Supervisor / TM)
    // -----------------------------------------------------------------------
    public async Task<AttendanceResult> ReviewAbsenceRequestAsync(
        int requestId, ReviewAbsenceRequestRequest req, Guid actorId, string actorRole, CancellationToken ct)
    {
        if (actorRole != Roles.Supervisor && actorRole != Roles.TrainingManager)
            return AttendanceResult.Fail("forbidden");

        var absReq = await _db.AbsenceRequests.FirstOrDefaultAsync(r => r.Id == requestId, ct);
        if (absReq is null) return AttendanceResult.Fail("not_found");
        if (absReq.Status != AbsenceRequestStatus.Pending) return AttendanceResult.Fail("already_reviewed");

        if (actorRole == Roles.Supervisor)
        {
            var ok = await _db.Enrollments.AnyAsync(
                e => e.StudentId == absReq.StudentId &&
                     _db.Courses.Any(c => c.Id == e.CourseId && c.Track.SupervisorId == actorId), ct);
            if (!ok) return AttendanceResult.Fail("forbidden");
        }

        absReq.Status = req.Approve ? AbsenceRequestStatus.Approved : AbsenceRequestStatus.Rejected;
        absReq.ReviewedById = actorId;
        absReq.ReviewedAt = DateTime.UtcNow;
        absReq.ReviewNote = req.ReviewNote;

        if (req.Approve)
        {
            var requestedDates = JsonSerializer.Deserialize<List<DateTime>>(absReq.RequestedDatesJson)!
                .Select(d => d.Date).ToHashSet();

            // Link matching absence records to this request (mark as excused)
            var matchingAttendances = await _db.Attendances
                .Where(a => a.StudentId == absReq.StudentId && a.IsAbsent &&
                            requestedDates.Contains(a.SessionDate.Date))
                .ToListAsync(ct);

            foreach (var a in matchingAttendances)
                a.AbsenceRequestId = absReq.Id;
        }

        await _db.SaveChangesAsync(ct);

        // Emit notification to student
        _db.Notifications.Add(new Notification
        {
            UserId = absReq.StudentId,
            Title = req.Approve ? "Absence request approved" : "Absence request rejected",
            Body = req.ReviewNote ?? (req.Approve ? "Your absence excuse has been approved." : "Your absence excuse was not approved."),
            Type = NotificationType.AbsenceRequestUpdate,
            RelatedEntityId = absReq.Id.ToString()
        });

        await _db.SaveChangesAsync(ct);

        // Refresh absence percentages for the student
        var courseIds = await _db.Enrollments
            .Where(e => e.StudentId == absReq.StudentId && e.Status == EnrollmentStatus.Active)
            .Select(e => e.CourseId).ToListAsync(ct);

        foreach (var cid in courseIds)
        {
            var enrollGroup = await _db.Enrollments
                .Where(e => e.StudentId == absReq.StudentId && e.CourseId == cid)
                .Select(e => e.GroupId).FirstOrDefaultAsync(ct);
            if (enrollGroup != 0)
                await RefreshAbsencePercentagesAsync(cid, enrollGroup, ct);
        }

        return AttendanceResult.Ok();
    }

    // -----------------------------------------------------------------------
    // Helpers
    // -----------------------------------------------------------------------
    private async Task<bool> CanViewCourseAttendance(int courseId, int groupId, Guid actorId, string actorRole, CancellationToken ct)
    {
        if (actorRole == Roles.TrainingManager) return true;

        if (actorRole == Roles.Supervisor)
            return await _db.Courses.AnyAsync(c => c.Id == courseId && c.Track.SupervisorId == actorId, ct);

        if (actorRole == Roles.TA)
            return await _db.GroupTAs.AnyAsync(gt => gt.UserId == actorId && gt.GroupId == groupId, ct);

        return false;
    }

    private async Task RefreshAbsencePercentagesAsync(int courseId, int groupId, CancellationToken ct)
    {
        var totalSessions = await _db.Attendances
            .Where(a => a.CourseId == courseId && a.GroupId == groupId)
            .Select(a => new { a.SessionDate, a.SessionOrdinal })
            .Distinct().CountAsync(ct);

        if (totalSessions == 0) return;

        var studentIds = await _db.Attendances
            .Where(a => a.CourseId == courseId && a.GroupId == groupId)
            .Select(a => a.StudentId).Distinct().ToListAsync(ct);

        foreach (var studentId in studentIds)
        {
            var unexcusedAbsences = await _db.Attendances.CountAsync(
                a => a.CourseId == courseId && a.GroupId == groupId &&
                     a.StudentId == studentId && a.IsAbsent && a.AbsenceRequestId == null, ct);

            var grade = await _db.Grades.FirstOrDefaultAsync(
                g => g.CourseId == courseId && g.StudentId == studentId, ct);

            if (grade is not null)
                grade.AbsencePercentage = unexcusedAbsences * 100m / totalSessions;
        }

        await _db.SaveChangesAsync(ct);
    }
}
