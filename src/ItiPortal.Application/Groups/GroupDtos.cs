using System.ComponentModel.DataAnnotations;

namespace ItiPortal.Application.Groups;

public record GroupDto(int Id, int TrackId, string Name, string? Code, bool IsActive);

public record CreateGroupRequest(
    [Required, MinLength(1), MaxLength(100)] string Name,
    [MaxLength(50)] string? Code);

public record UpdateGroupRequest([Required] string Name, string? Code);

public record GroupTaDto(int GroupId, Guid UserId, string TaName, DateTime AssignedAt);

public record AssignTaRequest([Required] Guid UserId);

public record StudentSummaryDto(Guid Id, string FullName, string Email);

public record GroupResult(bool Success, string? ErrorCode = null)
{
    public static GroupResult Ok() => new(true);
    public static GroupResult Fail(string code) => new(false, code);
}

public record GroupResult<T>(bool Success, T? Value, string? ErrorCode = null)
{
    public static GroupResult<T> Ok(T value) => new(true, value);
    public static GroupResult<T> Fail(string code) => new(false, default, code);
}
