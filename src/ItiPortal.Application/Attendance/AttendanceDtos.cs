using System.ComponentModel.DataAnnotations;
using ItiPortal.Domain.Enums;

namespace ItiPortal.Application.Attendance;

public record AttendanceEntryRequest(Guid StudentId, bool IsAbsent, string? Notes);

public record RecordSessionRequest(
    DateTime SessionDate,
    SessionType SessionType,
    int SessionOrdinal,
    IReadOnlyList<AttendanceEntryRequest> Entries);

public record AttendanceRowDto(
    Guid StudentId, string StudentName,
    DateTime SessionDate, SessionType SessionType, int SessionOrdinal,
    bool IsAbsent, bool IsExcused, string? Notes);

public record SessionSummaryDto(
    DateTime SessionDate, SessionType SessionType, int SessionOrdinal,
    int TotalStudents, int AbsentCount);

public record StudentAttendanceSummaryDto(
    int CourseId, string CourseName,
    int TotalSessions, int AbsentSessions, int ExcusedSessions,
    decimal AbsencePercentage);

public record CreateAbsenceRequestRequest(
    [Required, MinLength(1)] IReadOnlyList<DateTime> RequestedDates,
    [Required, MinLength(5)] string Reason);

public record ReviewAbsenceRequestRequest(
    bool Approve,
    string? ReviewNote);

public record AbsenceRequestDto(
    int Id, Guid StudentId, string StudentName,
    IReadOnlyList<DateTime> RequestedDates, string Reason,
    AbsenceRequestStatus Status,
    Guid? ReviewedById, DateTime? ReviewedAt, string? ReviewNote,
    DateTime SubmittedAt);

public record AttendanceResult(bool Success, string? ErrorCode = null)
{
    public static AttendanceResult Ok() => new(true);
    public static AttendanceResult Fail(string code) => new(false, code);
}

public record AttendanceResult<T>(bool Success, T? Value, string? ErrorCode = null)
{
    public static AttendanceResult<T> Ok(T v) => new(true, v);
    public static AttendanceResult<T> Fail(string code) => new(false, default, code);
}
