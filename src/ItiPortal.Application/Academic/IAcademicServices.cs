using ItiPortal.Domain.Enums;

namespace ItiPortal.Application.Academic;

public interface ITrackService
{
    Task<AcademicResult<IReadOnlyList<TrackDto>>> ListAsync(int intakeId, CancellationToken ct);
    Task<AcademicResult<TrackDto>> GetAsync(int id, CancellationToken ct);
    Task<AcademicResult<TrackDto>> CreateAsync(int intakeId, CreateTrackRequest request, CancellationToken ct);
    Task<AcademicResult> UpdateAsync(int id, UpdateTrackRequest request, Guid actorId, string actorRole, CancellationToken ct);
    Task<AcademicResult> AssignSupervisorAsync(int id, AssignSupervisorRequest request, CancellationToken ct);
    Task<AcademicResult> ArchiveAsync(int id, CancellationToken ct);
}

public interface ICourseService
{
    Task<AcademicResult<IReadOnlyList<CourseDto>>> ListAsync(int trackId, Guid actorId, string actorRole, CancellationToken ct);
    Task<AcademicResult<CourseDto>> CreateAsync(int trackId, CreateCourseRequest request, Guid actorId, string actorRole, CancellationToken ct);
    Task<AcademicResult> UpdateAsync(int id, UpdateCourseRequest request, Guid actorId, string actorRole, CancellationToken ct);
    Task<AcademicResult> ArchiveAsync(int id, Guid actorId, string actorRole, CancellationToken ct);
}
