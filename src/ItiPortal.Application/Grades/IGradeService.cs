namespace ItiPortal.Application.Grades;

public interface IGradeService
{
    Task<GradeResult<IReadOnlyList<GradeRowDto>>> ListForCourseAsync(int courseId, Guid actorId, string actorRole, CancellationToken ct);
    Task<GradeResult> SetLabAsync(int courseId, Guid studentId, SetGradeRequest req, Guid actorId, string actorRole, CancellationToken ct);
    Task<GradeResult> SetExamAsync(int courseId, Guid studentId, SetGradeRequest req, Guid actorId, string actorRole, CancellationToken ct);
    Task<GradeResult> PublishAsync(int courseId, Guid actorId, string actorRole, CancellationToken ct);
    Task<GradeResult<IReadOnlyList<StudentGradeDto>>> GetStudentGradesAsync(Guid studentId, Guid actorId, string actorRole, CancellationToken ct);
}

public static class GradeCalculator
{
    /// <summary>
    /// Compute total grade per blueprint Section 6.1.
    /// GradesOnly:           total = exam
    /// GradesAndAbsence:     total = exam (absence shown separately as warning)
    /// LabAndAbsence:        total = (lab*0.6) — simplification; institutional weights configurable later
    /// ExamMode:             total = exam (set by Exams module)
    /// </summary>
    public static decimal? Compute(Domain.Enums.GradingMode mode, decimal? lab, decimal? exam) => mode switch
    {
        Domain.Enums.GradingMode.GradesOnly => exam,
        Domain.Enums.GradingMode.GradesAndAbsence => exam,
        Domain.Enums.GradingMode.LabAndAbsence => lab,
        Domain.Enums.GradingMode.ExamMode => exam,
        _ => null
    };
}
