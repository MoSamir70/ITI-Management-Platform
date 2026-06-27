namespace ItiPortal.Domain.Enums;

public static class Roles
{
    public const string TrainingManager = "TrainingManager";
    public const string Supervisor = "Supervisor";
    public const string TA = "TA";
    public const string StudentAffairs = "StudentAffairs";
    public const string Student = "Student";

    public static readonly IReadOnlyList<string> All = new[]
    {
        TrainingManager, Supervisor, TA, StudentAffairs, Student
    };
}

public enum GradingMode
{
    GradesOnly = 0,
    GradesAndAbsence = 1,
    LabAndAbsence = 2,
    ExamMode = 3
}

public enum ExamType
{
    Regular = 0,
    Corrective = 1
}

public enum SessionType
{
    Online = 0,
    Offline = 1
}

public enum AbsenceRequestStatus
{
    Pending = 0,
    Approved = 1,
    Rejected = 2
}

public enum KpiType
{
    Certificate = 0,
    Freelance = 1
}

public enum KpiStatus
{
    Pending = 0,
    Approved = 1,
    Rejected = 2
}

public enum NotificationType
{
    ExamScheduled = 0,
    ExamUpdated = 1,
    CorrectiveExam = 2,
    GradePublished = 3,
    AbsenceRequestUpdate = 4,
    KpiDecision = 5,
    GeneralAnnouncement = 6
}

public enum EnrollmentStatus
{
    Active = 0,
    Dropped = 1,
    Completed = 2
}

public enum EntityStatus
{
    Active = 0,
    Archived = 1
}
