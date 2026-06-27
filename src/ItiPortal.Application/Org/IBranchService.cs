namespace ItiPortal.Application.Org;

public interface IBranchService
{
    Task<OrgResult<IReadOnlyList<BranchDto>>> ListAsync(bool includeArchived, CancellationToken ct);
    Task<OrgResult<BranchDto>> GetAsync(int id, CancellationToken ct);
    Task<OrgResult<BranchDto>> CreateAsync(CreateBranchRequest request, Guid actorId, CancellationToken ct);
    Task<OrgResult> UpdateAsync(int id, UpdateBranchRequest request, CancellationToken ct);
    Task<OrgResult> ArchiveAsync(int id, CancellationToken ct);
}

public interface IIntakeService
{
    Task<OrgResult<IReadOnlyList<IntakeDto>>> ListAsync(int branchId, bool includeArchived, CancellationToken ct);
    Task<OrgResult<IntakeDto>> GetAsync(int id, CancellationToken ct);
    Task<OrgResult<IntakeDto>> CreateAsync(int branchId, CreateIntakeRequest request, CancellationToken ct);
    Task<OrgResult> UpdateAsync(int id, UpdateIntakeRequest request, CancellationToken ct);
    Task<OrgResult> ArchiveAsync(int id, CancellationToken ct);
}
