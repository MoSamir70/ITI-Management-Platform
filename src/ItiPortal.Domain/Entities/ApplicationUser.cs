using Microsoft.AspNetCore.Identity;

namespace ItiPortal.Domain.Entities;

public class ApplicationUser : IdentityUser<Guid>
{
    public string FullName { get; set; } = null!;
    public string? NationalId { get; set; }
    public string? Gender { get; set; }
    public DateTime? DateOfBirth { get; set; }
    public string? PhotoUrl { get; set; }

    public int? GroupId { get; set; }
    public Group? Group { get; set; }

    public bool IsActive { get; set; } = true;
    public bool MustChangePassword { get; set; } = true;

    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    public Guid? CreatedById { get; set; }
    public ApplicationUser? CreatedBy { get; set; }
}

public class ApplicationRole : IdentityRole<Guid>
{
    public ApplicationRole() { }
    public ApplicationRole(string name) : base(name) { }
}
