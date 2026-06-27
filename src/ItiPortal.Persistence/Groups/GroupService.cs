using ItiPortal.Application.Groups;
using ItiPortal.Domain.Entities;
using ItiPortal.Domain.Enums;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace ItiPortal.Persistence.Groups;

public class GroupService : IGroupService
{
    private readonly AppDbContext _db;
    private readonly UserManager<ApplicationUser> _users;

    public GroupService(AppDbContext db, UserManager<ApplicationUser> users)
    {
        _db = db;
        _users = users;
    }

    public async Task<GroupResult<IReadOnlyList<GroupDto>>> ListAsync(int trackId, CancellationToken ct)
    {
        var list = await _db.Groups.AsNoTracking()
            .Where(g => g.TrackId == trackId)
            .OrderBy(g => g.Name)
            .Select(g => new GroupDto(g.Id, g.TrackId, g.Name, g.Code, g.IsActive))
            .ToListAsync(ct);
        return GroupResult<IReadOnlyList<GroupDto>>.Ok(list);
    }

    public async Task<GroupResult<GroupDto>> CreateAsync(int trackId, CreateGroupRequest req, Guid actorId, string actorRole, CancellationToken ct)
    {
        var track = await _db.Tracks.FirstOrDefaultAsync(t => t.Id == trackId, ct);
        if (track is null) return GroupResult<GroupDto>.Fail("track_not_found");
        if (actorRole == Roles.Supervisor && track.SupervisorId != actorId)
            return GroupResult<GroupDto>.Fail("forbidden");

        if (await _db.Groups.AnyAsync(g => g.TrackId == trackId && g.Name == req.Name, ct))
            return GroupResult<GroupDto>.Fail("group_name_exists_in_track");

        var g = new Group { TrackId = trackId, Name = req.Name, Code = req.Code, IsActive = true };
        _db.Groups.Add(g);
        await _db.SaveChangesAsync(ct);
        return GroupResult<GroupDto>.Ok(new GroupDto(g.Id, g.TrackId, g.Name, g.Code, g.IsActive));
    }

    public async Task<GroupResult> UpdateAsync(int id, UpdateGroupRequest req, Guid actorId, string actorRole, CancellationToken ct)
    {
        var g = await _db.Groups.Include(x => x.Track).FirstOrDefaultAsync(x => x.Id == id, ct);
        if (g is null) return GroupResult.Fail("not_found");
        if (actorRole == Roles.Supervisor && g.Track.SupervisorId != actorId)
            return GroupResult.Fail("forbidden");
        g.Name = req.Name;
        g.Code = req.Code;
        await _db.SaveChangesAsync(ct);
        return GroupResult.Ok();
    }

    public async Task<GroupResult> ArchiveAsync(int id, Guid actorId, string actorRole, CancellationToken ct)
    {
        var g = await _db.Groups.Include(x => x.Track).FirstOrDefaultAsync(x => x.Id == id, ct);
        if (g is null) return GroupResult.Fail("not_found");
        if (actorRole == Roles.Supervisor && g.Track.SupervisorId != actorId)
            return GroupResult.Fail("forbidden");
        if (await _db.Users.AnyAsync(u => u.GroupId == id, ct))
            return GroupResult.Fail("group_has_students");
        g.IsActive = false;
        await _db.SaveChangesAsync(ct);
        return GroupResult.Ok();
    }

    public async Task<GroupResult<IReadOnlyList<GroupTaDto>>> ListTasAsync(int groupId, CancellationToken ct)
    {
        var list = await _db.GroupTAs.AsNoTracking()
            .Where(gt => gt.GroupId == groupId)
            .Join(_db.Users, gt => gt.UserId, u => u.Id, (gt, u) => new GroupTaDto(gt.GroupId, gt.UserId, u.FullName, gt.AssignedAt))
            .ToListAsync(ct);
        return GroupResult<IReadOnlyList<GroupTaDto>>.Ok(list);
    }

    public async Task<GroupResult> AssignTaAsync(int groupId, AssignTaRequest req, Guid actorId, string actorRole, CancellationToken ct)
    {
        var group = await _db.Groups.Include(g => g.Track).FirstOrDefaultAsync(g => g.Id == groupId, ct);
        if (group is null) return GroupResult.Fail("not_found");
        if (actorRole == Roles.Supervisor && group.Track.SupervisorId != actorId)
            return GroupResult.Fail("forbidden");

        var user = await _users.FindByIdAsync(req.UserId.ToString());
        if (user is null) return GroupResult.Fail("ta_not_found");
        var roles = await _users.GetRolesAsync(user);
        if (!roles.Contains(Roles.TA)) return GroupResult.Fail("invalid_ta_role");

        if (await _db.GroupTAs.AnyAsync(gt => gt.GroupId == groupId && gt.UserId == req.UserId, ct))
            return GroupResult.Fail("ta_already_assigned");

        _db.GroupTAs.Add(new GroupTA
        {
            GroupId = groupId,
            UserId = req.UserId,
            AssignedAt = DateTime.UtcNow,
            AssignedById = actorId
        });
        await _db.SaveChangesAsync(ct);
        return GroupResult.Ok();
    }

    public async Task<GroupResult> RemoveTaAsync(int groupId, Guid userId, Guid actorId, string actorRole, CancellationToken ct)
    {
        var group = await _db.Groups.Include(g => g.Track).FirstOrDefaultAsync(g => g.Id == groupId, ct);
        if (group is null) return GroupResult.Fail("not_found");
        if (actorRole == Roles.Supervisor && group.Track.SupervisorId != actorId)
            return GroupResult.Fail("forbidden");

        var link = await _db.GroupTAs.FirstOrDefaultAsync(gt => gt.GroupId == groupId && gt.UserId == userId, ct);
        if (link is null) return GroupResult.Fail("not_found");
        _db.GroupTAs.Remove(link);
        await _db.SaveChangesAsync(ct);
        return GroupResult.Ok();
    }

    public async Task<GroupResult<IReadOnlyList<StudentSummaryDto>>> ListStudentsAsync(int groupId, Guid actorId, string actorRole, CancellationToken ct)
    {
        if (actorRole == Roles.TA)
        {
            var assigned = await _db.GroupTAs.AnyAsync(gt => gt.GroupId == groupId && gt.UserId == actorId, ct);
            if (!assigned) return GroupResult<IReadOnlyList<StudentSummaryDto>>.Fail("not_found");
        }
        if (actorRole == Roles.Supervisor)
        {
            var ok = await _db.Groups
                .Where(g => g.Id == groupId)
                .Join(_db.Tracks, g => g.TrackId, t => t.Id, (g, t) => t.SupervisorId)
                .AnyAsync(sid => sid == actorId, ct);
            if (!ok) return GroupResult<IReadOnlyList<StudentSummaryDto>>.Fail("not_found");
        }

        var list = await _db.Users.AsNoTracking()
            .Where(u => u.GroupId == groupId)
            .OrderBy(u => u.FullName)
            .Select(u => new StudentSummaryDto(u.Id, u.FullName, u.Email!))
            .ToListAsync(ct);
        return GroupResult<IReadOnlyList<StudentSummaryDto>>.Ok(list);
    }
}
