using System.ComponentModel.DataAnnotations;

namespace ItiPortal.Application.Org;

public record BranchDto(int Id, string Name, string Code, bool IsActive);

public record CreateBranchRequest(
    [Required, MinLength(2), MaxLength(200)] string Name,
    [Required, MinLength(2), MaxLength(10), RegularExpression("^[A-Z0-9]+$")] string Code);

public record UpdateBranchRequest(
    [Required, MinLength(2), MaxLength(200)] string Name);

public record IntakeDto(int Id, int BranchId, string Name, int Number, DateTime StartDate, DateTime EndDate, bool IsActive);

public record CreateIntakeRequest(
    [Required, MinLength(2), MaxLength(100)] string Name,
    [Required, Range(1, 999)] int Number,
    [Required] DateTime StartDate,
    [Required] DateTime EndDate);

public record UpdateIntakeRequest(
    [Required, MinLength(2), MaxLength(100)] string Name,
    [Required] DateTime StartDate,
    [Required] DateTime EndDate);

public record OrgResult(bool Success, string? ErrorCode = null, string? ErrorDescription = null)
{
    public static OrgResult Ok() => new(true);
    public static OrgResult Fail(string code, string? desc = null) => new(false, code, desc);
}

public record OrgResult<T>(bool Success, T? Value, string? ErrorCode = null, string? ErrorDescription = null)
{
    public static OrgResult<T> Ok(T value) => new(true, value);
    public static OrgResult<T> Fail(string code, string? desc = null) => new(false, default, code, desc);
}
