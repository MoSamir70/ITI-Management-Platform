using ItiPortal.Application.Kpi;
using ItiPortal.Domain.Entities;
using ItiPortal.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace ItiPortal.Persistence.Kpis;

public class KpiService : IKpiService
{
    private readonly AppDbContext _db;
    public KpiService(AppDbContext db) => _db = db;

    public async Task<KpiResult<int>> SubmitAsync(SubmitKpiRequest req, Guid studentId, CancellationToken ct)
    {
        var kpi = new Domain.Entities.Kpi
        {
            StudentId = studentId,
            KpiType = req.KpiType,
            Title = req.Title,
            TrackId = req.TrackId,
            CourseId = req.CourseId,
            IssuingBody = req.IssuingBody,
            IssueDate = req.IssueDate,
            ExpiryDate = req.ExpiryDate,
            Platform = req.Platform,
            ClientContact = req.ClientContact,
            ProjectDescription = req.ProjectDescription,
            AmountEarned = req.AmountEarned,
            FileUrl = req.FileUrl,
            Status = KpiStatus.Pending,
            SubmittedAt = DateTime.UtcNow
        };
        _db.Kpis.Add(kpi);
        await _db.SaveChangesAsync(ct);
        return KpiResult<int>.Ok(kpi.Id);
    }

    public async Task<KpiResult<IReadOnlyList<KpiDto>>> GetMyKpisAsync(Guid studentId, CancellationToken ct)
    {
        var list = await _db.Kpis
            .Where(k => k.StudentId == studentId)
            .Include(k => k.Student)
            .OrderByDescending(k => k.SubmittedAt)
            .Select(k => ToDto(k))
            .ToListAsync(ct);

        return KpiResult<IReadOnlyList<KpiDto>>.Ok(list);
    }

    public async Task<KpiResult<IReadOnlyList<KpiDto>>> ListPendingAsync(
        Guid actorId, string actorRole, CancellationToken ct)
    {
        if (actorRole == Roles.Student || actorRole == Roles.TA || actorRole == Roles.StudentAffairs)
            return KpiResult<IReadOnlyList<KpiDto>>.Fail("forbidden");

        IQueryable<Domain.Entities.Kpi> q = _db.Kpis.Include(k => k.Student)
            .Where(k => k.Status == KpiStatus.Pending);

        if (actorRole == Roles.Supervisor)
        {
            // Supervisor only sees KPIs from students enrolled in their tracks
            var supervisorStudentIds = _db.Enrollments
                .Where(e => _db.Courses.Any(c => c.Id == e.CourseId && c.Track.SupervisorId == actorId))
                .Select(e => e.StudentId);
            q = q.Where(k => supervisorStudentIds.Contains(k.StudentId));
        }

        var list = await q.OrderByDescending(k => k.SubmittedAt)
            .Select(k => ToDto(k)).ToListAsync(ct);

        return KpiResult<IReadOnlyList<KpiDto>>.Ok(list);
    }

    public async Task<KpiResult<KpiDto>> GetAsync(int kpiId, Guid actorId, string actorRole, CancellationToken ct)
    {
        var kpi = await _db.Kpis.Include(k => k.Student).FirstOrDefaultAsync(k => k.Id == kpiId, ct);
        if (kpi is null) return KpiResult<KpiDto>.Fail("not_found");

        // Student can only see their own
        if (actorRole == Roles.Student && kpi.StudentId != actorId)
            return KpiResult<KpiDto>.Fail("forbidden");

        if (actorRole == Roles.StudentAffairs || actorRole == Roles.TA)
            return KpiResult<KpiDto>.Fail("forbidden");

        if (actorRole == Roles.Supervisor)
        {
            var ok = await _db.Enrollments.AnyAsync(
                e => e.StudentId == kpi.StudentId &&
                     _db.Courses.Any(c => c.Id == e.CourseId && c.Track.SupervisorId == actorId), ct);
            if (!ok) return KpiResult<KpiDto>.Fail("forbidden");
        }

        return KpiResult<KpiDto>.Ok(ToDto(kpi));
    }

    public async Task<KpiResult> ReviewAsync(
        int kpiId, ReviewKpiRequest req, Guid actorId, string actorRole, CancellationToken ct)
    {
        if (actorRole != Roles.Supervisor && actorRole != Roles.TrainingManager)
            return KpiResult.Fail("forbidden");

        var kpi = await _db.Kpis.FirstOrDefaultAsync(k => k.Id == kpiId, ct);
        if (kpi is null) return KpiResult.Fail("not_found");
        if (kpi.Status != KpiStatus.Pending) return KpiResult.Fail("already_reviewed");

        if (actorRole == Roles.Supervisor)
        {
            var ok = await _db.Enrollments.AnyAsync(
                e => e.StudentId == kpi.StudentId &&
                     _db.Courses.Any(c => c.Id == e.CourseId && c.Track.SupervisorId == actorId), ct);
            if (!ok) return KpiResult.Fail("forbidden");
        }

        kpi.Status = req.Approve ? KpiStatus.Approved : KpiStatus.Rejected;
        kpi.ReviewedById = actorId;
        kpi.ReviewedAt = DateTime.UtcNow;
        kpi.ReviewNote = req.ReviewNote;
        await _db.SaveChangesAsync(ct);

        _db.Notifications.Add(new Notification
        {
            UserId = kpi.StudentId,
            Title = req.Approve ? "KPI approved" : "KPI rejected",
            Body = req.ReviewNote ?? (req.Approve ? $"\"{kpi.Title}\" has been approved." : $"\"{kpi.Title}\" was not approved."),
            Type = NotificationType.KpiDecision,
            RelatedEntityId = kpi.Id.ToString()
        });
        await _db.SaveChangesAsync(ct);

        return KpiResult.Ok();
    }

    private static KpiDto ToDto(Domain.Entities.Kpi k) => new(
        k.Id, k.StudentId, k.Student?.FullName ?? "",
        k.KpiType, k.Title, k.TrackId, k.CourseId,
        k.IssuingBody, k.IssueDate, k.ExpiryDate,
        k.Platform, k.ClientContact, k.ProjectDescription, k.AmountEarned,
        k.FileUrl,
        k.Status, k.ReviewedById, k.ReviewedAt, k.ReviewNote,
        k.SubmittedAt);
}
