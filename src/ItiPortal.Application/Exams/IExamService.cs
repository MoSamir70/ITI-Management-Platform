namespace ItiPortal.Application.Exams;

public interface IExamService
{
    Task<ExamResult<ExamDto>> CreateAsync(int courseId, CreateExamRequest req, Guid actorId, string actorRole, CancellationToken ct);
    Task<ExamResult<IReadOnlyList<ExamDto>>> ListForCourseAsync(int courseId, Guid actorId, string actorRole, CancellationToken ct);
    Task<ExamResult<ExamDto>> GetAsync(int examId, Guid actorId, string actorRole, CancellationToken ct);
    Task<ExamResult> UpdateAsync(int examId, UpdateExamRequest req, Guid actorId, string actorRole, CancellationToken ct);
    Task<ExamResult> PublishAsync(int examId, Guid actorId, string actorRole, CancellationToken ct);
    Task<ExamResult<IReadOnlyList<ExamDto>>> GetMyExamsAsync(Guid studentId, CancellationToken ct);
}
