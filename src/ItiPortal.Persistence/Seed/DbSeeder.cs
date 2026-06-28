using ItiPortal.Domain.Entities;
using ItiPortal.Domain.Enums;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace ItiPortal.Persistence.Seed;

public static class DbSeeder
{
    public const string DefaultAdminEmail    = "admin@iti.local";
    public const string DefaultAdminPassword = "Admin!2026";

    private static readonly DateTime Now = new DateTime(2025, 6, 1, 9, 0, 0, DateTimeKind.Utc);

    public static async Task SeedAsync(
        AppDbContext db,
        UserManager<ApplicationUser> userManager,
        RoleManager<ApplicationRole> roleManager,
        CancellationToken ct = default)
    {
        await EnsureRolesAsync(roleManager);
        var admin = await EnsureAdminAsync(userManager);
        var branch = await EnsureDefaultBranchAsync(db, admin.Id, ct);

        // Stop here if dummy data already exists
        if (await db.Intakes.AnyAsync(ct)) return;

        var supervisor = await EnsureSupervisorAsync(userManager, admin.Id);
        var ta         = await EnsureTaAsync(userManager, admin.Id);
        var students   = await EnsureStudentsAsync(userManager, admin.Id);

        var intake  = await SeedIntakeAsync(db, branch, admin.Id, ct);
        var track   = await SeedTrackAsync(db, intake, supervisor, ct);
        var webCourse = await SeedCourseAsync(db, track, "Web Development",         "WEB-101", true,  ct);
        var dbCourse  = await SeedCourseAsync(db, track, "Database Fundamentals",   "DB-101",  false, ct);
        var group   = await SeedGroupAsync(db, track, ta, students, admin, ct);

        await SeedEnrollmentsAsync(db, students, webCourse, dbCourse, group, ct);
        await SeedGradesAsync(db, students, webCourse, dbCourse, group, admin, ct);
        await SeedAttendanceAsync(db, students, webCourse, group, admin, ct);
        await SeedExamAsync(db, webCourse, admin, ct);
        await SeedKpiAsync(db, students, track, supervisor, ct);
        await SeedNotificationsAsync(db, students, admin, supervisor, ct);
    }

    /* ─── Roles ────────────────────────────────────────── */
    private static async Task EnsureRolesAsync(RoleManager<ApplicationRole> rm)
    {
        foreach (var role in Roles.All)
            if (!await rm.RoleExistsAsync(role))
                await rm.CreateAsync(new ApplicationRole(role));
    }

    /* ─── Admin ────────────────────────────────────────── */
    private static async Task<ApplicationUser> EnsureAdminAsync(UserManager<ApplicationUser> um)
    {
        var existing = await um.FindByEmailAsync(DefaultAdminEmail);
        if (existing is not null) return existing;

        var admin = new ApplicationUser
        {
            UserName = DefaultAdminEmail, Email = DefaultAdminEmail,
            EmailConfirmed = true, FullName = "Ahmed Salem",
            IsActive = true, MustChangePassword = false,
            CreatedAt = Now, UpdatedAt = Now
        };
        Throw(await um.CreateAsync(admin, DefaultAdminPassword));
        await um.AddToRoleAsync(admin, Roles.TrainingManager);
        return admin;
    }

    /* ─── Branch ───────────────────────────────────────── */
    private static async Task<Branch> EnsureDefaultBranchAsync(AppDbContext db, Guid adminId, CancellationToken ct)
    {
        var b = await db.Branches.FirstOrDefaultAsync(ct);
        if (b is not null) return b;
        b = new Branch { Name = "Alexandria", Code = "ALX", IsActive = true, CreatedById = adminId, CreatedAt = Now, UpdatedAt = Now };
        db.Branches.Add(b);
        await db.SaveChangesAsync(ct);
        return b;
    }

    /* ─── Supervisor ───────────────────────────────────── */
    private static async Task<ApplicationUser> EnsureSupervisorAsync(UserManager<ApplicationUser> um, Guid adminId)
    {
        const string email = "supervisor@iti.local";
        var u = await um.FindByEmailAsync(email);
        if (u is not null) return u;
        u = new ApplicationUser
        {
            UserName = email, Email = email, EmailConfirmed = true,
            FullName = "Ali Hassan", IsActive = true, MustChangePassword = false,
            CreatedById = adminId, CreatedAt = Now, UpdatedAt = Now
        };
        Throw(await um.CreateAsync(u, "Super!2026"));
        await um.AddToRoleAsync(u, Roles.Supervisor);
        return u;
    }

    /* ─── TA ───────────────────────────────────────────── */
    private static async Task<ApplicationUser> EnsureTaAsync(UserManager<ApplicationUser> um, Guid adminId)
    {
        const string email = "ta@iti.local";
        var u = await um.FindByEmailAsync(email);
        if (u is not null) return u;
        u = new ApplicationUser
        {
            UserName = email, Email = email, EmailConfirmed = true,
            FullName = "Mohamed Kamal", IsActive = true, MustChangePassword = false,
            CreatedById = adminId, CreatedAt = Now, UpdatedAt = Now
        };
        Throw(await um.CreateAsync(u, "Ta!2026Ta"));
        await um.AddToRoleAsync(u, Roles.TA);
        return u;
    }

    /* ─── Students ─────────────────────────────────────── */
    private static readonly (string email, string name)[] StudentData =
    [
        ("sara.ahmed@iti.local",    "Sara Ahmed"),
        ("omar.khaled@iti.local",   "Omar Khaled"),
        ("nour.hassan@iti.local",   "Nour Hassan"),
        ("youssef.ali@iti.local",   "Youssef Ali"),
        ("layla.ibrahim@iti.local", "Layla Ibrahim"),
        ("karim.mahmoud@iti.local", "Karim Mahmoud"),
        ("hana.samir@iti.local",    "Hana Samir"),
        ("adam.tarek@iti.local",    "Adam Tarek"),
    ];

    private static async Task<List<ApplicationUser>> EnsureStudentsAsync(UserManager<ApplicationUser> um, Guid adminId)
    {
        var result = new List<ApplicationUser>();
        foreach (var (email, name) in StudentData)
        {
            var u = await um.FindByEmailAsync(email);
            if (u is null)
            {
                u = new ApplicationUser
                {
                    UserName = email, Email = email, EmailConfirmed = true,
                    FullName = name, IsActive = true, MustChangePassword = false,
                    CreatedById = adminId, CreatedAt = Now, UpdatedAt = Now
                };
                Throw(await um.CreateAsync(u, "Student!2026"));
                await um.AddToRoleAsync(u, Roles.Student);
            }
            result.Add(u);
        }
        return result;
    }

    /* ─── Intake ───────────────────────────────────────── */
    private static async Task<Intake> SeedIntakeAsync(AppDbContext db, Branch branch, Guid adminId, CancellationToken ct)
    {
        var intake = new Intake
        {
            BranchId = branch.Id, Name = "Intake 2024", Number = 44,
            StartDate = new DateTime(2024, 10, 1, 0, 0, 0, DateTimeKind.Utc),
            EndDate   = new DateTime(2025, 7, 31, 0, 0, 0, DateTimeKind.Utc),
            IsActive  = true, CreatedAt = Now, UpdatedAt = Now
        };
        db.Intakes.Add(intake);
        await db.SaveChangesAsync(ct);
        return intake;
    }

    /* ─── Track ────────────────────────────────────────── */
    private static async Task<Track> SeedTrackAsync(AppDbContext db, Intake intake, ApplicationUser supervisor, CancellationToken ct)
    {
        var track = new Track
        {
            IntakeId = intake.Id, Name = "Information Technology", Code = "IT",
            SupervisorId = supervisor.Id,
            CertificateKpiEnabled = true, FreelanceKpiEnabled = true,
            Status = EntityStatus.Active, CreatedAt = Now, UpdatedAt = Now
        };
        db.Tracks.Add(track);
        await db.SaveChangesAsync(ct);
        return track;
    }

    /* ─── Course ───────────────────────────────────────── */
    private static async Task<Course> SeedCourseAsync(
        AppDbContext db, Track track, string name, string code, bool hasExam, CancellationToken ct)
    {
        var course = new Course
        {
            TrackId = track.Id, Name = name, Code = code,
            InstructorName = "Dr. Khaled Nasser",
            LectureHours = 30, LabHours = 20, SelfStudyHours = 10,
            GradingMode = GradingMode.GradesAndAbsence,
            HasExam = hasExam, Status = EntityStatus.Active,
            CreatedAt = Now, UpdatedAt = Now
        };
        db.Courses.Add(course);
        await db.SaveChangesAsync(ct);
        return course;
    }

    /* ─── Group ────────────────────────────────────────── */
    private static async Task<Group> SeedGroupAsync(
        AppDbContext db, Track track, ApplicationUser ta,
        List<ApplicationUser> students, ApplicationUser admin, CancellationToken ct)
    {
        var group = new Group
        {
            TrackId = track.Id, Name = "Group A", Code = "GRP-A",
            IsActive = true, CreatedAt = Now, UpdatedAt = Now
        };
        db.Groups.Add(group);
        await db.SaveChangesAsync(ct);

        // Assign TA
        db.Set<GroupTA>().Add(new GroupTA
        {
            GroupId = group.Id, UserId = ta.Id,
            AssignedAt = Now, AssignedById = admin.Id
        });

        // Assign students to group
        foreach (var s in students)
        {
            s.GroupId = group.Id;
            s.UpdatedAt = Now;
        }
        await db.SaveChangesAsync(ct);
        return group;
    }

    /* ─── Enrollments ──────────────────────────────────── */
    private static async Task SeedEnrollmentsAsync(
        AppDbContext db, List<ApplicationUser> students,
        Course webCourse, Course dbCourse, Group group, CancellationToken ct)
    {
        var enrollments = new List<StudentCourseEnrollment>();
        foreach (var s in students)
        {
            enrollments.Add(new StudentCourseEnrollment
            {
                StudentId = s.Id, CourseId = webCourse.Id, GroupId = group.Id,
                EnrolledAt = Now, Status = EnrollmentStatus.Active
            });
            enrollments.Add(new StudentCourseEnrollment
            {
                StudentId = s.Id, CourseId = dbCourse.Id, GroupId = group.Id,
                EnrolledAt = Now, Status = EnrollmentStatus.Active
            });
        }
        db.Set<StudentCourseEnrollment>().AddRange(enrollments);
        await db.SaveChangesAsync(ct);
    }

    /* ─── Grades ───────────────────────────────────────── */
    private static readonly (decimal lab, decimal exam)[] GradeValues =
    [
        (88, 91), (74, 68), (95, 97), (62, 70),
        (80, 85), (91, 88), (55, 60), (78, 82)
    ];

    private static async Task SeedGradesAsync(
        AppDbContext db, List<ApplicationUser> students,
        Course webCourse, Course dbCourse, Group group,
        ApplicationUser admin, CancellationToken ct)
    {
        var grades = new List<Grade>();
        for (int i = 0; i < students.Count; i++)
        {
            var s = students[i];
            var (lab, exam) = GradeValues[i];
            var total = (lab + exam) / 2m;

            grades.Add(new Grade
            {
                StudentId = s.Id, CourseId = webCourse.Id, GroupId = group.Id,
                LabGrade = lab, ExamGrade = exam, TotalGrade = total,
                AbsencePercentage = (i % 4 == 0) ? 10m : 5m,
                IsPublished = true, PublishedAt = Now.AddDays(-2), PublishedById = admin.Id,
                EnteredAt = Now.AddDays(-3), EnteredById = admin.Id,
                Notes = total >= 75 ? "Well done" : "Needs improvement",
                CreatedAt = Now.AddDays(-3), UpdatedAt = Now.AddDays(-2)
            });

            // DB course — slightly different scores
            var dbLab = Math.Min(100, lab + 3); var dbExam = Math.Min(100, exam - 2);
            grades.Add(new Grade
            {
                StudentId = s.Id, CourseId = dbCourse.Id, GroupId = group.Id,
                LabGrade = dbLab, ExamGrade = dbExam, TotalGrade = (dbLab + dbExam) / 2m,
                AbsencePercentage = 5m,
                IsPublished = true, PublishedAt = Now.AddDays(-1), PublishedById = admin.Id,
                EnteredAt = Now.AddDays(-2), EnteredById = admin.Id,
                CreatedAt = Now.AddDays(-2), UpdatedAt = Now.AddDays(-1)
            });
        }
        db.Set<Grade>().AddRange(grades);
        await db.SaveChangesAsync(ct);
    }

    /* ─── Attendance ───────────────────────────────────── */
    private static async Task SeedAttendanceAsync(
        AppDbContext db, List<ApplicationUser> students,
        Course webCourse, Group group, ApplicationUser admin, CancellationToken ct)
    {
        var records = new List<Attendance>();
        for (int session = 1; session <= 5; session++)
        {
            var date = Now.AddDays(-(6 - session) * 7);
            for (int i = 0; i < students.Count; i++)
            {
                // Simulate ~85% attendance; students index 3 and 6 miss some sessions
                var absent = (i == 3 && session <= 2) || (i == 6 && session == 3);
                records.Add(new Attendance
                {
                    StudentId = students[i].Id, CourseId = webCourse.Id, GroupId = group.Id,
                    SessionDate = date, SessionType = session % 2 == 0 ? SessionType.Online : SessionType.Offline,
                    SessionOrdinal = session, IsAbsent = absent,
                    RecordedById = admin.Id,
                    Notes = absent ? "No prior notice" : null,
                    RecordedAt = date.AddHours(2),
                    CreatedAt = date, UpdatedAt = date.AddHours(2)
                });
            }
        }
        db.Set<Attendance>().AddRange(records);
        await db.SaveChangesAsync(ct);
    }

    /* ─── Exam ─────────────────────────────────────────── */
    private static async Task SeedExamAsync(
        AppDbContext db, Course webCourse, ApplicationUser admin, CancellationToken ct)
    {
        db.Set<Exam>().Add(new Exam
        {
            CourseId = webCourse.Id, ExamType = ExamType.Regular,
            ExamDate = Now.AddDays(14), Location = "Hall B-12",
            DurationMinutes = 120, IsPublished = true,
            PublishedAt = Now, PublishedById = admin.Id,
            Notes = "Open-book allowed for DB section.",
            CreatedAt = Now, UpdatedAt = Now
        });
        await db.SaveChangesAsync(ct);
    }

    /* ─── KPI ──────────────────────────────────────────── */
    private static async Task SeedKpiAsync(
        AppDbContext db, List<ApplicationUser> students,
        Track track, ApplicationUser supervisor, CancellationToken ct)
    {
        var kpis = new List<Kpi>
        {
            new Kpi
            {
                StudentId = students[0].Id, TrackId = track.Id,
                KpiType = KpiType.Certificate, Title = "AWS Cloud Practitioner",
                IssuingBody = "Amazon Web Services", IssueDate = Now.AddDays(-30),
                Platform = "Credly", FileUrl = "https://example.com/cert1.pdf",
                Status = KpiStatus.Approved, ReviewedById = supervisor.Id, ReviewedAt = Now.AddDays(-20),
                ReviewNote = "Valid certification, well done.",
                SubmittedAt = Now.AddDays(-35), CreatedAt = Now.AddDays(-35), UpdatedAt = Now.AddDays(-20)
            },
            new Kpi
            {
                StudentId = students[2].Id, TrackId = track.Id,
                KpiType = KpiType.Certificate, Title = "Google Data Analytics Certificate",
                IssuingBody = "Google / Coursera", IssueDate = Now.AddDays(-15),
                Platform = "Coursera", FileUrl = "https://example.com/cert2.pdf",
                Status = KpiStatus.Approved, ReviewedById = supervisor.Id, ReviewedAt = Now.AddDays(-10),
                ReviewNote = "Verified on Coursera.",
                SubmittedAt = Now.AddDays(-18), CreatedAt = Now.AddDays(-18), UpdatedAt = Now.AddDays(-10)
            },
            new Kpi
            {
                StudentId = students[4].Id, TrackId = track.Id,
                KpiType = KpiType.Freelance, Title = "E-commerce Website for Local Client",
                ClientContact = "client@example.com", AmountEarned = 1500,
                ProjectDescription = "Built a full-stack e-commerce site using React and Node.js",
                FileUrl = "https://example.com/freelance-proof.pdf",
                Status = KpiStatus.Pending,
                SubmittedAt = Now.AddDays(-5), CreatedAt = Now.AddDays(-5), UpdatedAt = Now.AddDays(-5)
            },
            new Kpi
            {
                StudentId = students[6].Id, TrackId = track.Id,
                KpiType = KpiType.Certificate, Title = "Microsoft Azure Fundamentals AZ-900",
                IssuingBody = "Microsoft", IssueDate = Now.AddDays(-7),
                Platform = "Microsoft Learn", FileUrl = "https://example.com/cert3.pdf",
                Status = KpiStatus.Pending,
                SubmittedAt = Now.AddDays(-6), CreatedAt = Now.AddDays(-6), UpdatedAt = Now.AddDays(-6)
            },
        };
        db.Set<Kpi>().AddRange(kpis);
        await db.SaveChangesAsync(ct);
    }

    /* ─── Notifications ────────────────────────────────── */
    private static async Task SeedNotificationsAsync(
        AppDbContext db, List<ApplicationUser> students,
        ApplicationUser admin, ApplicationUser supervisor, CancellationToken ct)
    {
        var notifications = new List<Notification>();

        // Announce exam to all students
        foreach (var s in students)
        {
            notifications.Add(new Notification
            {
                UserId = s.Id,
                Title = "Exam Scheduled: Web Development Final",
                Body  = "Your Web Development final exam has been scheduled for June 15, 2025 at 9:00 AM in Hall B-12. Duration: 2 hours.",
                Type  = NotificationType.ExamScheduled,
                IsRead = students.IndexOf(s) < 3,
                CreatedAt = Now, UpdatedAt = Now
            });
        }

        // Grades published
        foreach (var s in students.Take(4))
        {
            notifications.Add(new Notification
            {
                UserId = s.Id,
                Title = "Grades Published: Database Fundamentals",
                Body  = "Your grades for Database Fundamentals have been published. Log in to view your results.",
                Type  = NotificationType.GradePublished,
                IsRead = true, ReadAt = Now.AddDays(1),
                CreatedAt = Now.AddDays(-1), UpdatedAt = Now.AddDays(1)
            });
        }

        // KPI decisions
        notifications.Add(new Notification
        {
            UserId = students[0].Id,
            Title  = "KPI Approved: AWS Cloud Practitioner",
            Body   = "Your KPI submission 'AWS Cloud Practitioner' has been approved by your supervisor. Keep up the great work!",
            Type   = NotificationType.KpiDecision,
            IsRead = false, CreatedAt = Now.AddDays(-20), UpdatedAt = Now.AddDays(-20)
        });

        notifications.Add(new Notification
        {
            UserId = students[2].Id,
            Title  = "KPI Approved: Google Data Analytics",
            Body   = "Your KPI submission 'Google Data Analytics Certificate' has been approved.",
            Type   = NotificationType.KpiDecision,
            IsRead = true, ReadAt = Now.AddDays(-9),
            CreatedAt = Now.AddDays(-10), UpdatedAt = Now.AddDays(-9)
        });

        // General announcement
        notifications.Add(new Notification
        {
            UserId = supervisor.Id,
            Title  = "New KPI Submissions Awaiting Review",
            Body   = "3 new KPI submissions are pending your review. Please log in and review them.",
            Type   = NotificationType.GeneralAnnouncement,
            IsRead = false, CreatedAt = Now.AddDays(-5), UpdatedAt = Now.AddDays(-5)
        });

        db.Set<Notification>().AddRange(notifications);
        await db.SaveChangesAsync(ct);
    }

    /* ─── Helper ───────────────────────────────────────── */
    private static void Throw(IdentityResult r)
    {
        if (!r.Succeeded)
            throw new InvalidOperationException("Seed failed: " + string.Join("; ", r.Errors.Select(e => e.Description)));
    }
}
