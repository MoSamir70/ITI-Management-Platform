namespace ItiPortal.Application.Users;

public interface IUserService
{
    Task<UserResult<UserCreatedResponse>> CreateAsync(CreateUserRequest request, Guid actorId, string actorRole, CancellationToken ct);
    Task<UserResult<PagedResult<UserSummary>>> ListAsync(string? role, int? branchId, bool? isActive, string? q, int page, int pageSize, CancellationToken ct);
    Task<UserResult<UserDetail>> GetAsync(Guid id, Guid actorId, string actorRole, CancellationToken ct);
    Task<UserResult> UpdateAsync(Guid id, UpdateUserRequest request, Guid actorId, string actorRole, CancellationToken ct);
    Task<UserResult> UpdateMyProfileAsync(Guid id, UpdateMyProfileRequest request, CancellationToken ct);
    Task<UserResult> DeactivateAsync(Guid id, CancellationToken ct);
    Task<UserResult<UserDetail>> GetMeAsync(Guid id, CancellationToken ct);
}
