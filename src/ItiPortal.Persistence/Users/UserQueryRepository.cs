using ItiPortal.Application.Users;
using ItiPortal.Domain.Entities;
using ItiPortal.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace ItiPortal.Persistence.Users;

public class UserQueryRepository : IUserQueryRepository
{
    private readonly AppDbContext _db;
    public UserQueryRepository(AppDbContext db) => _db = db;

    public Task<bool> NationalIdExistsAsync(string nationalId, CancellationToken ct)
        => _db.Users.AnyAsync(u => u.NationalId == nationalId, ct);

    public async Task<UserResult<PagedResult<UserSummary>>> ListAsync(
        string? role, int? branchId, bool? isActive, string? q, int page, int pageSize, CancellationToken ct)
    {
        if (page < 1) page = 1;
        if (pageSize < 1) pageSize = 20;

        var query =
            from u in _db.Users
            join ur in _db.UserRoles on u.Id equals ur.UserId
            join r in _db.Roles on ur.RoleId equals r.Id
            select new { u, RoleName = r.Name! };

        if (!string.IsNullOrWhiteSpace(role))
            query = query.Where(x => x.RoleName == role);

        if (isActive.HasValue)
            query = query.Where(x => x.u.IsActive == isActive.Value);

        if (!string.IsNullOrWhiteSpace(q))
            query = query.Where(x => x.u.FullName.Contains(q) || x.u.Email!.Contains(q));

        // branchId filter currently unused (no direct user→branch link); requires join via Group→Track→Intake→Branch.
        // Wire up when group/track CRUD lands in spec 004-006.

        var total = await query.CountAsync(ct);
        var items = await query
            .OrderBy(x => x.u.FullName)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(x => new UserSummary(x.u.Id, x.u.Email!, x.u.FullName, x.RoleName, x.u.IsActive, x.u.GroupId))
            .ToListAsync(ct);

        return UserResult<PagedResult<UserSummary>>.Ok(
            new PagedResult<UserSummary>(items, total, page, pageSize));
    }

    public async Task<UserDetail?> GetDetailAsync(Guid id, CancellationToken ct)
    {
        var row = await (
            from u in _db.Users.AsNoTracking()
            where u.Id == id
            from ur in _db.UserRoles.Where(r => r.UserId == u.Id).DefaultIfEmpty()
            from r in _db.Roles.Where(r => r.Id == ur.RoleId).DefaultIfEmpty()
            select new { u, RoleName = r != null ? r.Name : null }
        ).FirstOrDefaultAsync(ct);

        if (row is null) return null;

        return new UserDetail(
            row.u.Id, row.u.Email!, row.u.FullName, row.RoleName ?? "Unknown",
            row.u.IsActive, row.u.MustChangePassword,
            row.u.PhoneNumber, row.u.Gender, row.u.DateOfBirth, row.u.NationalId,
            row.u.GroupId, row.u.PhotoUrl, row.u.CreatedAt);
    }

    public async Task<bool> IsStudentInSupervisorTrackAsync(Guid studentId, Guid supervisorId, CancellationToken ct)
    {
        return await (
            from u in _db.Users
            where u.Id == studentId && u.GroupId != null
            join g in _db.Groups on u.GroupId equals g.Id
            join t in _db.Tracks on g.TrackId equals t.Id
            where t.SupervisorId == supervisorId
            select u.Id
        ).AnyAsync(ct);
    }

    public async Task<bool> IsStudentInTaGroupAsync(Guid studentId, Guid taId, CancellationToken ct)
    {
        return await (
            from u in _db.Users
            where u.Id == studentId && u.GroupId != null
            join gt in _db.GroupTAs on u.GroupId equals gt.GroupId
            where gt.UserId == taId
            select u.Id
        ).AnyAsync(ct);
    }

    public async Task<bool> HasActiveAssignmentsAsync(Guid userId, CancellationToken ct)
    {
        var asSupervisor = await _db.Tracks.AnyAsync(t => t.SupervisorId == userId && t.Status == EntityStatus.Active, ct);
        if (asSupervisor) return true;
        var asTa = await _db.GroupTAs.AnyAsync(gt => gt.UserId == userId, ct);
        return asTa;
    }
}
