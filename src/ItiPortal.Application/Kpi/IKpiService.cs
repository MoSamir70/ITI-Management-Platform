namespace ItiPortal.Application.Kpi;

public interface IKpiService
{
    Task<KpiResult<int>> SubmitAsync(SubmitKpiRequest req, Guid studentId, CancellationToken ct);
    Task<KpiResult<IReadOnlyList<KpiDto>>> GetMyKpisAsync(Guid studentId, CancellationToken ct);
    Task<KpiResult<IReadOnlyList<KpiDto>>> ListPendingAsync(Guid actorId, string actorRole, CancellationToken ct);
    Task<KpiResult<KpiDto>> GetAsync(int kpiId, Guid actorId, string actorRole, CancellationToken ct);
    Task<KpiResult> ReviewAsync(int kpiId, ReviewKpiRequest req, Guid actorId, string actorRole, CancellationToken ct);
}
