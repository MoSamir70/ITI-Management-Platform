using System.ComponentModel.DataAnnotations;
using ItiPortal.Domain.Enums;

namespace ItiPortal.Application.Exams;

public record CreateExamRequest(
    [Required] ExamType ExamType,
    [Required] DateTime ExamDate,
    string? ExamLink,
    string? Location,
    [Range(1, 600)] int DurationMinutes,
    string? Notes,
    IReadOnlyList<Guid>? CorrectiveStudentIds);

public record UpdateExamRequest(
    DateTime? ExamDate,
    string? ExamLink,
    string? Location,
    [Range(1, 600)] int? DurationMinutes,
    string? Notes);

public record ExamDto(
    int Id, int CourseId, string CourseName,
    ExamType ExamType, DateTime ExamDate,
    string? ExamLink, string? Location, int DurationMinutes,
    bool IsPublished, DateTime? PublishedAt,
    string? Notes, IReadOnlyList<Guid>? CorrectiveStudentIds);

public record ExamResult(bool Success, string? ErrorCode = null)
{
    public static ExamResult Ok() => new(true);
    public static ExamResult Fail(string code) => new(false, code);
}

public record ExamResult<T>(bool Success, T? Value, string? ErrorCode = null)
{
    public static ExamResult<T> Ok(T v) => new(true, v);
    public static ExamResult<T> Fail(string code) => new(false, default, code);
}
