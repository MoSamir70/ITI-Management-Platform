using System.ComponentModel.DataAnnotations;
using ItiPortal.Domain.Enums;

namespace ItiPortal.Application.Kpi;

public record SubmitKpiRequest(
    [Required] KpiType KpiType,
    [Required, MinLength(2)] string Title,
    int? TrackId,
    int? CourseId,
    // Certificate fields
    string? IssuingBody,
    DateTime? IssueDate,
    DateTime? ExpiryDate,
    // Freelance fields
    string? Platform,
    string? ClientContact,
    string? ProjectDescription,
    decimal? AmountEarned,
    [Required, MinLength(1)] string FileUrl);

public record ReviewKpiRequest(
    bool Approve,
    string? ReviewNote);

public record KpiDto(
    int Id, Guid StudentId, string StudentName,
    KpiType KpiType, string Title,
    int? TrackId, int? CourseId,
    string? IssuingBody, DateTime? IssueDate, DateTime? ExpiryDate,
    string? Platform, string? ClientContact, string? ProjectDescription, decimal? AmountEarned,
    string FileUrl,
    KpiStatus Status, Guid? ReviewedById, DateTime? ReviewedAt, string? ReviewNote,
    DateTime SubmittedAt);

public record KpiResult(bool Success, string? ErrorCode = null)
{
    public static KpiResult Ok() => new(true);
    public static KpiResult Fail(string code) => new(false, code);
}

public record KpiResult<T>(bool Success, T? Value, string? ErrorCode = null)
{
    public static KpiResult<T> Ok(T v) => new(true, v);
    public static KpiResult<T> Fail(string code) => new(false, default, code);
}
