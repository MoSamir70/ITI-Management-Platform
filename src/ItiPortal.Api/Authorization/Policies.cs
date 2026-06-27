using ItiPortal.Domain.Enums;
using Microsoft.AspNetCore.Authorization;

namespace ItiPortal.Api.Authorization;

public static class Policies
{
    public const string IsTrainingManager = nameof(IsTrainingManager);
    public const string IsSupervisor = nameof(IsSupervisor);
    public const string IsTA = nameof(IsTA);
    public const string IsStudentAffairs = nameof(IsStudentAffairs);
    public const string IsStudent = nameof(IsStudent);
    public const string IsStaff = nameof(IsStaff);

    public static void Register(AuthorizationOptions opts)
    {
        opts.AddPolicy(IsTrainingManager, p => p.RequireRole(Roles.TrainingManager));
        opts.AddPolicy(IsSupervisor, p => p.RequireRole(Roles.Supervisor));
        opts.AddPolicy(IsTA, p => p.RequireRole(Roles.TA));
        opts.AddPolicy(IsStudentAffairs, p => p.RequireRole(Roles.StudentAffairs));
        opts.AddPolicy(IsStudent, p => p.RequireRole(Roles.Student));
        opts.AddPolicy(IsStaff, p => p.RequireRole(
            Roles.TrainingManager, Roles.Supervisor, Roles.TA, Roles.StudentAffairs));
        opts.FallbackPolicy = new AuthorizationPolicyBuilder()
            .RequireAuthenticatedUser()
            .Build();
    }
}
