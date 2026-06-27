namespace ItiPortal.Application.Attendance;

public interface IAttendanceService
{
    Task<AttendanceResult> RecordSessionAsync(int courseId, int groupId, RecordSessionRequest req, Guid actorId, string actorRole, CancellationToken ct);
    Task<AttendanceResult<IReadOnlyList<SessionSummaryDto>>> ListSessionsAsync(int courseId, int groupId, Guid actorId, string actorRole, CancellationToken ct);
    Task<AttendanceResult<IReadOnlyList<AttendanceRowDto>>> GetSessionAttendanceAsync(int courseId, int groupId, DateTime date, int ordinal, Guid actorId, string actorRole, CancellationToken ct);
    Task<AttendanceResult<IReadOnlyList<StudentAttendanceSummaryDto>>> GetStudentAttendanceAsync(Guid studentId, Guid actorId, string actorRole, CancellationToken ct);

    Task<AttendanceResult<int>> SubmitAbsenceRequestAsync(CreateAbsenceRequestRequest req, Guid studentId, CancellationToken ct);
    Task<AttendanceResult<IReadOnlyList<AbsenceRequestDto>>> ListAbsenceRequestsAsync(Guid actorId, string actorRole, CancellationToken ct);
    Task<AttendanceResult> ReviewAbsenceRequestAsync(int requestId, ReviewAbsenceRequestRequest req, Guid actorId, string actorRole, CancellationToken ct);
}
