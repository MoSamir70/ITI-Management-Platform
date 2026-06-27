using ItiPortal.Domain.Enums;

namespace ItiPortal.Domain.Entities;

public class AbsenceRequest : BaseEntity
{
    public Guid StudentId { get; set; }
    public ApplicationUser Student { get; set; } = null!;

    public string RequestedDatesJson { get; set; } = "[]";
    public string Reason { get; set; } = null!;
    public AbsenceRequestStatus Status { get; set; } = AbsenceRequestStatus.Pending;

    public Guid? ReviewedById { get; set; }
    public ApplicationUser? ReviewedBy { get; set; }
    public DateTime? ReviewedAt { get; set; }
    public string? ReviewNote { get; set; }

    public DateTime SubmittedAt { get; set; }
}
