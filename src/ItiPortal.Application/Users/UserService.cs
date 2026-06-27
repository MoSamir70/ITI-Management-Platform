using System.Security.Cryptography;
using ItiPortal.Application.Auth;
using ItiPortal.Domain.Entities;
using ItiPortal.Domain.Enums;
using Microsoft.AspNetCore.Identity;

namespace ItiPortal.Application.Users;

public class UserService : IUserService
{
    private readonly UserManager<ApplicationUser> _users;
    private readonly IUserQueryRepository _query;
    private readonly IRefreshTokenStore _refreshStore;

    public UserService(
        UserManager<ApplicationUser> users,
        IUserQueryRepository query,
        IRefreshTokenStore refreshStore)
    {
        _users = users;
        _query = query;
        _refreshStore = refreshStore;
    }

    public async Task<UserResult<UserCreatedResponse>> CreateAsync(
        CreateUserRequest request, Guid actorId, string actorRole, CancellationToken ct)
    {
        if (!Roles.All.Contains(request.Role))
            return UserResult<UserCreatedResponse>.Fail("invalid_role");

        if (actorRole == Roles.StudentAffairs && request.Role != Roles.Student)
            return UserResult<UserCreatedResponse>.Fail("forbidden_role");

        if (actorRole == Roles.TrainingManager && request.Role == Roles.Student)
            return UserResult<UserCreatedResponse>.Fail("students_must_be_created_by_student_affairs");

        if (request.Role == Roles.Student)
        {
            if (string.IsNullOrWhiteSpace(request.NationalId) || !IsValidEgyptianNationalId(request.NationalId))
                return UserResult<UserCreatedResponse>.Fail("invalid_national_id");
            if (request.GroupId is null)
                return UserResult<UserCreatedResponse>.Fail("group_required");
        }

        if (await _users.FindByEmailAsync(request.Email) is not null)
            return UserResult<UserCreatedResponse>.Fail("email_already_exists");

        if (!string.IsNullOrWhiteSpace(request.NationalId)
            && await _query.NationalIdExistsAsync(request.NationalId, ct))
            return UserResult<UserCreatedResponse>.Fail("national_id_already_exists");

        var user = new ApplicationUser
        {
            UserName = request.Email,
            Email = request.Email,
            EmailConfirmed = true,
            PhoneNumber = request.Phone,
            FullName = request.FullName,
            Gender = request.Gender,
            DateOfBirth = request.DateOfBirth,
            NationalId = request.NationalId,
            GroupId = request.GroupId,
            IsActive = true,
            MustChangePassword = true,
            CreatedById = actorId
        };

        var tempPassword = GenerateTempPassword();
        var create = await _users.CreateAsync(user, tempPassword);
        if (!create.Succeeded)
            return UserResult<UserCreatedResponse>.Fail("create_failed",
                string.Join("; ", create.Errors.Select(e => e.Description)));

        await _users.AddToRoleAsync(user, request.Role);

        return UserResult<UserCreatedResponse>.Ok(new UserCreatedResponse(user.Id, tempPassword));
    }

    public Task<UserResult<PagedResult<UserSummary>>> ListAsync(
        string? role, int? branchId, bool? isActive, string? q, int page, int pageSize, CancellationToken ct)
        => _query.ListAsync(role, branchId, isActive, q, page, Math.Min(pageSize, 100), ct);

    public async Task<UserResult<UserDetail>> GetAsync(Guid id, Guid actorId, string actorRole, CancellationToken ct)
    {
        var detail = await _query.GetDetailAsync(id, ct);
        if (detail is null) return UserResult<UserDetail>.Fail("not_found");

        if (actorRole == Roles.Supervisor && !await _query.IsStudentInSupervisorTrackAsync(id, actorId, ct))
            return UserResult<UserDetail>.Fail("not_found");

        if (actorRole == Roles.TA && !await _query.IsStudentInTaGroupAsync(id, actorId, ct))
            return UserResult<UserDetail>.Fail("not_found");

        if (actorRole == Roles.TA && detail.Role == Roles.Student)
            detail = detail with { NationalId = null, DateOfBirth = null };

        return UserResult<UserDetail>.Ok(detail);
    }

    public async Task<UserResult> UpdateAsync(Guid id, UpdateUserRequest req, Guid actorId, string actorRole, CancellationToken ct)
    {
        var user = await _users.FindByIdAsync(id.ToString());
        if (user is null) return UserResult.Fail("not_found");

        if (actorRole == Roles.StudentAffairs)
        {
            var roles = await _users.GetRolesAsync(user);
            if (!roles.Contains(Roles.Student)) return UserResult.Fail("forbidden");
        }

        user.FullName = req.FullName;
        user.PhoneNumber = req.Phone;
        user.Gender = req.Gender;
        user.DateOfBirth = req.DateOfBirth;
        user.NationalId = req.NationalId;
        user.GroupId = req.GroupId;
        var res = await _users.UpdateAsync(user);
        return res.Succeeded ? UserResult.Ok() : UserResult.Fail("update_failed");
    }

    public async Task<UserResult> UpdateMyProfileAsync(Guid id, UpdateMyProfileRequest req, CancellationToken ct)
    {
        var user = await _users.FindByIdAsync(id.ToString());
        if (user is null) return UserResult.Fail("not_found");
        user.PhoneNumber = req.Phone ?? user.PhoneNumber;
        user.PhotoUrl = req.PhotoUrl ?? user.PhotoUrl;
        await _users.UpdateAsync(user);
        return UserResult.Ok();
    }

    public async Task<UserResult> DeactivateAsync(Guid id, CancellationToken ct)
    {
        var user = await _users.FindByIdAsync(id.ToString());
        if (user is null) return UserResult.Fail("not_found");

        if (await _query.HasActiveAssignmentsAsync(id, ct))
            return UserResult.Fail("has_active_assignments");

        user.IsActive = false;
        await _users.UpdateAsync(user);
        await _refreshStore.RevokeAllForUserAsync(id, ct);
        return UserResult.Ok();
    }

    public async Task<UserResult<UserDetail>> GetMeAsync(Guid id, CancellationToken ct)
    {
        var detail = await _query.GetDetailAsync(id, ct);
        return detail is null
            ? UserResult<UserDetail>.Fail("not_found")
            : UserResult<UserDetail>.Ok(detail);
    }

    private static bool IsValidEgyptianNationalId(string id)
        => id.Length == 14 && id.All(char.IsDigit);

    private static string GenerateTempPassword()
    {
        const string chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%";
        var bytes = RandomNumberGenerator.GetBytes(16);
        return new string(bytes.Select(b => chars[b % chars.Length]).ToArray());
    }
}

public interface IUserQueryRepository
{
    Task<bool> NationalIdExistsAsync(string nationalId, CancellationToken ct);
    Task<UserResult<PagedResult<UserSummary>>> ListAsync(string? role, int? branchId, bool? isActive, string? q, int page, int pageSize, CancellationToken ct);
    Task<UserDetail?> GetDetailAsync(Guid id, CancellationToken ct);
    Task<bool> IsStudentInSupervisorTrackAsync(Guid studentId, Guid supervisorId, CancellationToken ct);
    Task<bool> IsStudentInTaGroupAsync(Guid studentId, Guid taId, CancellationToken ct);
    Task<bool> HasActiveAssignmentsAsync(Guid userId, CancellationToken ct);
}
