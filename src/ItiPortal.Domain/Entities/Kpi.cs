using ItiPortal.Domain.Enums;

namespace ItiPortal.Domain.Entities;

public class Kpi : BaseEntity
{
    public Guid StudentId { get; set; }
    public ApplicationUser Student { get; set; } = null!;

    public int? TrackId { get; set; }
    public Track? Track { get; set; }

    public int? CourseId { get; set; }
    public Course? Course { get; set; }

    public KpiType KpiType { get; set; }
    public string Title { get; set; } = null!;

    public string? IssuingBody { get; set; }
    public DateTime? IssueDate { get; set; }
    public DateTime? ExpiryDate { get; set; }

    public string? Platform { get; set; }
    public string? ClientContact { get; set; }
    public string? ProjectDescription { get; set; }
    public decimal? AmountEarned { get; set; }

    public string FileUrl { get; set; } = null!;

    public KpiStatus Status { get; set; } = KpiStatus.Pending;
    public Guid? ReviewedById { get; set; }
    public DateTime? ReviewedAt { get; set; }
    public string? ReviewNote { get; set; }

    public DateTime SubmittedAt { get; set; }
}
