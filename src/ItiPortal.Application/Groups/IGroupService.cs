namespace ItiPortal.Application.Groups;

public interface IGroupService
{
    Task<GroupResult<IReadOnlyList<GroupDto>>> ListAsync(int trackId, CancellationToken ct);
    Task<GroupResult<GroupDto>> CreateAsync(int trackId, CreateGroupRequest req, Guid actorId, string actorRole, CancellationToken ct);
    Task<GroupResult> UpdateAsync(int id, UpdateGroupRequest req, Guid actorId, string actorRole, CancellationToken ct);
    Task<GroupResult> ArchiveAsync(int id, Guid actorId, string actorRole, CancellationToken ct);

    Task<GroupResult<IReadOnlyList<GroupTaDto>>> ListTasAsync(int groupId, CancellationToken ct);
    Task<GroupResult> AssignTaAsync(int groupId, AssignTaRequest req, Guid actorId, string actorRole, CancellationToken ct);
    Task<GroupResult> RemoveTaAsync(int groupId, Guid userId, Guid actorId, string actorRole, CancellationToken ct);

    Task<GroupResult<IReadOnlyList<StudentSummaryDto>>> ListStudentsAsync(int groupId, Guid actorId, string actorRole, CancellationToken ct);
}
