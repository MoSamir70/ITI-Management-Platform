using System.ComponentModel.DataAnnotations;

namespace ItiPortal.Application.Grades;

public record GradeRowDto(
    Guid StudentId, string StudentName, int CourseId, int GroupId,
    decimal? LabGrade, decimal? ExamGrade, decimal? TotalGrade,
    decimal? AbsencePercentage, bool IsPublished, DateTime? PublishedAt);

public record SetGradeRequest([Range(0, 100)] decimal Value);

public record StudentGradeDto(
    int CourseId, string CourseName, decimal? LabGrade, decimal? ExamGrade,
    decimal? TotalGrade, decimal? AbsencePercentage, DateTime? PublishedAt);

public record GradeResult(bool Success, string? ErrorCode = null, IReadOnlyList<Guid>? MissingStudentIds = null)
{
    public static GradeResult Ok() => new(true);
    public static GradeResult Fail(string code, IReadOnlyList<Guid>? missing = null) => new(false, code, missing);
}

public record GradeResult<T>(bool Success, T? Value, string? ErrorCode = null)
{
    public static GradeResult<T> Ok(T v) => new(true, v);
    public static GradeResult<T> Fail(string code) => new(false, default, code);
}
