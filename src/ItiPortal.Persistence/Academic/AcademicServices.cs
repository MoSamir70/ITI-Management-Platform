using ItiPortal.Application.Academic;
using ItiPortal.Domain.Entities;
using ItiPortal.Domain.Enums;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace ItiPortal.Persistence.Academic;

public class TrackService : ITrackService
{
    private readonly AppDbContext _db;
    private readonly UserManager<ApplicationUser> _users;

    public TrackService(AppDbContext db, UserManager<ApplicationUser> users)
    {
        _db = db;
        _users = users;
    }

    public async Task<AcademicResult<IReadOnlyList<TrackDto>>> ListAsync(int intakeId, CancellationToken ct)
    {
        var list = await _db.Tracks.AsNoTracking()
            .Where(t => t.IntakeId == intakeId)
            .OrderBy(t => t.Name)
            .Select(t => new TrackDto(t.Id, t.IntakeId, t.Name, t.Code, t.SupervisorId,
                t.CertificateKpiEnabled, t.FreelanceKpiEnabled, t.Status))
            .ToListAsync(ct);
        return AcademicResult<IReadOnlyList<TrackDto>>.Ok(list);
    }

    public async Task<AcademicResult<TrackDto>> GetAsync(int id, CancellationToken ct)
    {
        var t = await _db.Tracks.AsNoTracking().FirstOrDefaultAsync(x => x.Id == id, ct);
        return t is null
            ? AcademicResult<TrackDto>.Fail("not_found")
            : AcademicResult<TrackDto>.Ok(new TrackDto(t.Id, t.IntakeId, t.Name, t.Code, t.SupervisorId,
                t.CertificateKpiEnabled, t.FreelanceKpiEnabled, t.Status));
    }

    public async Task<AcademicResult<TrackDto>> CreateAsync(int intakeId, CreateTrackRequest req, CancellationToken ct)
    {
        if (!await _db.Intakes.AnyAsync(i => i.Id == intakeId, ct))
            return AcademicResult<TrackDto>.Fail("intake_not_found");

        if (!await IsSupervisorRoleAsync(req.SupervisorId))
            return AcademicResult<TrackDto>.Fail("invalid_supervisor_role");

        if (await _db.Tracks.AnyAsync(t => t.IntakeId == intakeId && t.SupervisorId == req.SupervisorId, ct))
            return AcademicResult<TrackDto>.Fail("supervisor_already_assigned_in_intake");

        var t = new Track
        {
            IntakeId = intakeId,
            Name = req.Name,
            Code = req.Code,
            SupervisorId = req.SupervisorId,
            CertificateKpiEnabled = req.CertificateKpiEnabled,
            FreelanceKpiEnabled = req.FreelanceKpiEnabled,
            Status = EntityStatus.Active
        };
        _db.Tracks.Add(t);
        await _db.SaveChangesAsync(ct);
        return AcademicResult<TrackDto>.Ok(new TrackDto(t.Id, t.IntakeId, t.Name, t.Code, t.SupervisorId,
            t.CertificateKpiEnabled, t.FreelanceKpiEnabled, t.Status));
    }

    public async Task<AcademicResult> UpdateAsync(int id, UpdateTrackRequest req, Guid actorId, string actorRole, CancellationToken ct)
    {
        var t = await _db.Tracks.FirstOrDefaultAsync(x => x.Id == id, ct);
        if (t is null) return AcademicResult.Fail("not_found");

        if (actorRole == Roles.Supervisor && t.SupervisorId != actorId)
            return AcademicResult.Fail("forbidden");

        t.Name = req.Name;
        t.Code = req.Code;
        t.CertificateKpiEnabled = req.CertificateKpiEnabled;
        t.FreelanceKpiEnabled = req.FreelanceKpiEnabled;
        await _db.SaveChangesAsync(ct);
        return AcademicResult.Ok();
    }

    public async Task<AcademicResult> AssignSupervisorAsync(int id, AssignSupervisorRequest req, CancellationToken ct)
    {
        var t = await _db.Tracks.FirstOrDefaultAsync(x => x.Id == id, ct);
        if (t is null) return AcademicResult.Fail("not_found");
        if (!await IsSupervisorRoleAsync(req.SupervisorId))
            return AcademicResult.Fail("invalid_supervisor_role");
        if (await _db.Tracks.AnyAsync(x => x.IntakeId == t.IntakeId && x.SupervisorId == req.SupervisorId && x.Id != t.Id, ct))
            return AcademicResult.Fail("supervisor_already_assigned_in_intake");
        t.SupervisorId = req.SupervisorId;
        await _db.SaveChangesAsync(ct);
        return AcademicResult.Ok();
    }

    public async Task<AcademicResult> ArchiveAsync(int id, CancellationToken ct)
    {
        var t = await _db.Tracks.FirstOrDefaultAsync(x => x.Id == id, ct);
        if (t is null) return AcademicResult.Fail("not_found");
        t.Status = EntityStatus.Archived;
        await _db.SaveChangesAsync(ct);
        return AcademicResult.Ok();
    }

    private async Task<bool> IsSupervisorRoleAsync(Guid userId)
    {
        var user = await _users.FindByIdAsync(userId.ToString());
        if (user is null) return false;
        var roles = await _users.GetRolesAsync(user);
        return roles.Contains(Roles.Supervisor);
    }
}

public class CourseService : ICourseService
{
    private readonly AppDbContext _db;
    public CourseService(AppDbContext db) => _db = db;

    public async Task<AcademicResult<IReadOnlyList<CourseDto>>> ListAsync(int trackId, Guid actorId, string actorRole, CancellationToken ct)
    {
        var q = _db.Courses.AsNoTracking().Where(c => c.TrackId == trackId);

        if (actorRole == Roles.Supervisor)
        {
            var ok = await _db.Tracks.AnyAsync(t => t.Id == trackId && t.SupervisorId == actorId, ct);
            if (!ok) return AcademicResult<IReadOnlyList<CourseDto>>.Fail("not_found");
        }
        else if (actorRole == Roles.Student)
        {
            var ok = await _db.Users.Where(u => u.Id == actorId && u.GroupId != null)
                .Join(_db.Groups, u => u.GroupId, g => g.Id, (u, g) => g.TrackId)
                .AnyAsync(tid => tid == trackId, ct);
            if (!ok) return AcademicResult<IReadOnlyList<CourseDto>>.Fail("not_found");
        }
        else if (actorRole == Roles.TA)
        {
            var ok = await _db.GroupTAs.Where(gt => gt.UserId == actorId)
                .Join(_db.Groups, gt => gt.GroupId, g => g.Id, (gt, g) => g.TrackId)
                .AnyAsync(tid => tid == trackId, ct);
            if (!ok) return AcademicResult<IReadOnlyList<CourseDto>>.Fail("not_found");
        }

        var list = await q.OrderBy(c => c.Name)
            .Select(c => new CourseDto(c.Id, c.TrackId, c.Name, c.Code, c.InstructorName,
                c.LectureHours, c.LabHours, c.SelfStudyHours, c.GradingMode,
                c.CertificateKpiEnabled, c.FreelanceKpiEnabled, c.HasExam, c.Status))
            .ToListAsync(ct);
        return AcademicResult<IReadOnlyList<CourseDto>>.Ok(list);
    }

    public async Task<AcademicResult<CourseDto>> CreateAsync(int trackId, CreateCourseRequest req, Guid actorId, string actorRole, CancellationToken ct)
    {
        var track = await _db.Tracks.FirstOrDefaultAsync(t => t.Id == trackId, ct);
        if (track is null) return AcademicResult<CourseDto>.Fail("track_not_found");

        if (actorRole == Roles.Supervisor && track.SupervisorId != actorId)
            return AcademicResult<CourseDto>.Fail("forbidden");

        if (req.LectureHours + req.LabHours + req.SelfStudyHours > 200)
            return AcademicResult<CourseDto>.Fail("hours_out_of_range");

        var c = new Course
        {
            TrackId = trackId,
            Name = req.Name,
            Code = req.Code,
            InstructorName = req.InstructorName,
            LectureHours = req.LectureHours,
            LabHours = req.LabHours,
            SelfStudyHours = req.SelfStudyHours,
            GradingMode = req.GradingMode,
            CertificateKpiEnabled = req.CertificateKpiEnabled,
            FreelanceKpiEnabled = req.FreelanceKpiEnabled,
            HasExam = req.HasExam,
            Status = EntityStatus.Active
        };
        _db.Courses.Add(c);
        await _db.SaveChangesAsync(ct);
        return AcademicResult<CourseDto>.Ok(new CourseDto(c.Id, c.TrackId, c.Name, c.Code, c.InstructorName,
            c.LectureHours, c.LabHours, c.SelfStudyHours, c.GradingMode,
            c.CertificateKpiEnabled, c.FreelanceKpiEnabled, c.HasExam, c.Status));
    }

    public async Task<AcademicResult> UpdateAsync(int id, UpdateCourseRequest req, Guid actorId, string actorRole, CancellationToken ct)
    {
        var c = await _db.Courses.Include(x => x.Track).FirstOrDefaultAsync(x => x.Id == id, ct);
        if (c is null) return AcademicResult.Fail("not_found");
        if (actorRole == Roles.Supervisor && c.Track.SupervisorId != actorId)
            return AcademicResult.Fail("forbidden");

        c.Name = req.Name;
        c.InstructorName = req.InstructorName;
        c.LectureHours = req.LectureHours;
        c.LabHours = req.LabHours;
        c.SelfStudyHours = req.SelfStudyHours;
        c.CertificateKpiEnabled = req.CertificateKpiEnabled;
        c.FreelanceKpiEnabled = req.FreelanceKpiEnabled;
        c.HasExam = req.HasExam;
        await _db.SaveChangesAsync(ct);
        return AcademicResult.Ok();
    }

    public async Task<AcademicResult> ArchiveAsync(int id, Guid actorId, string actorRole, CancellationToken ct)
    {
        var c = await _db.Courses.Include(x => x.Track).FirstOrDefaultAsync(x => x.Id == id, ct);
        if (c is null) return AcademicResult.Fail("not_found");
        if (actorRole == Roles.Supervisor && c.Track.SupervisorId != actorId)
            return AcademicResult.Fail("forbidden");
        c.Status = EntityStatus.Archived;
        await _db.SaveChangesAsync(ct);
        return AcademicResult.Ok();
    }
}
