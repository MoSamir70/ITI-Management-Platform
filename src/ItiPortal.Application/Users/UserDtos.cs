using System.ComponentModel.DataAnnotations;

namespace ItiPortal.Application.Users;

public record CreateUserRequest(
    [Required, EmailAddress] string Email,
    [Required, MinLength(2)] string FullName,
    [Required] string Role,
    string? Phone,
    string? Gender,
    DateTime? DateOfBirth,
    string? NationalId,
    int? GroupId);

public record UpdateUserRequest(
    [Required, MinLength(2)] string FullName,
    string? Phone,
    string? Gender,
    DateTime? DateOfBirth,
    string? NationalId,
    int? GroupId);

public record UpdateMyProfileRequest(
    string? Phone,
    string? PhotoUrl);

public record UserSummary(
    Guid Id, string Email, string FullName, string Role, bool IsActive, int? GroupId);

public record UserDetail(
    Guid Id, string Email, string FullName, string Role, bool IsActive, bool MustChangePassword,
    string? Phone, string? Gender, DateTime? DateOfBirth, string? NationalId,
    int? GroupId, string? PhotoUrl, DateTime CreatedAt);

public record UserCreatedResponse(Guid Id, string TempPassword);

public record PagedResult<T>(IReadOnlyList<T> Items, int Total, int Page, int PageSize);

public record UserResult(bool Success, string? ErrorCode = null, string? ErrorDescription = null)
{
    public static UserResult Ok() => new(true);
    public static UserResult Fail(string code, string? desc = null) => new(false, code, desc);
}

public record UserResult<T>(bool Success, T? Value, string? ErrorCode = null, string? ErrorDescription = null)
{
    public static UserResult<T> Ok(T value) => new(true, value);
    public static UserResult<T> Fail(string code, string? desc = null) => new(false, default, code, desc);
}
