using System.ComponentModel.DataAnnotations;
using ItiPortal.Domain.Enums;

namespace ItiPortal.Application.Academic;

public record TrackDto(
    int Id, int IntakeId, string Name, string Code, Guid SupervisorId,
    bool CertificateKpiEnabled, bool FreelanceKpiEnabled, EntityStatus Status);

public record CreateTrackRequest(
    [Required, MinLength(2), MaxLength(200)] string Name,
    [Required, MinLength(2), MaxLength(50)] string Code,
    [Required] Guid SupervisorId,
    bool CertificateKpiEnabled = false,
    bool FreelanceKpiEnabled = false);

public record UpdateTrackRequest(
    [Required] string Name,
    [Required] string Code,
    bool CertificateKpiEnabled,
    bool FreelanceKpiEnabled);

public record AssignSupervisorRequest([Required] Guid SupervisorId);

public record CourseDto(
    int Id, int TrackId, string Name, string Code, string? InstructorName,
    int LectureHours, int LabHours, int SelfStudyHours,
    GradingMode GradingMode, bool CertificateKpiEnabled, bool FreelanceKpiEnabled,
    bool HasExam, EntityStatus Status);

public record CreateCourseRequest(
    [Required, MinLength(2), MaxLength(200)] string Name,
    [Required, MinLength(2), MaxLength(50)] string Code,
    string? InstructorName,
    [Range(0, 200)] int LectureHours,
    [Range(0, 200)] int LabHours,
    [Range(0, 200)] int SelfStudyHours,
    [Required] GradingMode GradingMode,
    bool CertificateKpiEnabled = false,
    bool FreelanceKpiEnabled = false,
    bool HasExam = true);

public record UpdateCourseRequest(
    [Required] string Name,
    string? InstructorName,
    [Range(0, 200)] int LectureHours,
    [Range(0, 200)] int LabHours,
    [Range(0, 200)] int SelfStudyHours,
    bool CertificateKpiEnabled,
    bool FreelanceKpiEnabled,
    bool HasExam);

public record AcademicResult(bool Success, string? ErrorCode = null, string? ErrorDescription = null)
{
    public static AcademicResult Ok() => new(true);
    public static AcademicResult Fail(string code) => new(false, code);
}

public record AcademicResult<T>(bool Success, T? Value, string? ErrorCode = null)
{
    public static AcademicResult<T> Ok(T value) => new(true, value);
    public static AcademicResult<T> Fail(string code) => new(false, default, code);
}
