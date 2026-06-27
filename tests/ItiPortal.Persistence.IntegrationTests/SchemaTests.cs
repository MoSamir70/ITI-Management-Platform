using FluentAssertions;
using ItiPortal.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace ItiPortal.Persistence.IntegrationTests;

public class SchemaTests
{
    [Fact]
    public async Task All_DbSets_are_queryable_against_freshly_created_schema()
    {
        using var fx = new SqliteFixture();
        using var db = fx.NewContext();

        (await db.Branches.CountAsync()).Should().Be(0);
        (await db.Intakes.CountAsync()).Should().Be(0);
        (await db.Tracks.CountAsync()).Should().Be(0);
        (await db.Groups.CountAsync()).Should().Be(0);
        (await db.GroupTAs.CountAsync()).Should().Be(0);
        (await db.Courses.CountAsync()).Should().Be(0);
        (await db.Enrollments.CountAsync()).Should().Be(0);
        (await db.Grades.CountAsync()).Should().Be(0);
        (await db.Attendances.CountAsync()).Should().Be(0);
        (await db.AbsenceRequests.CountAsync()).Should().Be(0);
        (await db.Exams.CountAsync()).Should().Be(0);
        (await db.CorrectiveExamStudents.CountAsync()).Should().Be(0);
        (await db.Kpis.CountAsync()).Should().Be(0);
        (await db.Notifications.CountAsync()).Should().Be(0);
        (await db.RefreshTokens.CountAsync()).Should().Be(0);
        (await db.Users.CountAsync()).Should().Be(0);
        (await db.Roles.CountAsync()).Should().Be(0);
    }

    [Fact]
    public async Task Branch_audit_timestamps_are_populated_on_save()
    {
        using var fx = new SqliteFixture();
        using var db = fx.NewContext();

        var before = DateTime.UtcNow.AddSeconds(-1);
        db.Branches.Add(new Branch { Name = "Cairo", Code = "CAI", IsActive = true });
        await db.SaveChangesAsync();

        var loaded = await db.Branches.SingleAsync();
        loaded.Name.Should().Be("Cairo");
        loaded.CreatedAt.Should().BeAfter(before);
        loaded.UpdatedAt.Should().Be(loaded.CreatedAt);
    }

    [Fact]
    public async Task Branch_audit_UpdatedAt_changes_on_modify()
    {
        using var fx = new SqliteFixture();
        using var db = fx.NewContext();

        db.Branches.Add(new Branch { Name = "A", Code = "AA" });
        await db.SaveChangesAsync();

        var loaded = await db.Branches.SingleAsync();
        var created = loaded.CreatedAt;
        await Task.Delay(20);
        loaded.Name = "AAA";
        await db.SaveChangesAsync();

        loaded.CreatedAt.Should().Be(created);
        loaded.UpdatedAt.Should().BeAfter(created);
    }

    [Fact]
    public async Task Branch_code_uniqueness_is_enforced()
    {
        using var fx = new SqliteFixture();
        using var db = fx.NewContext();

        db.Branches.Add(new Branch { Name = "A", Code = "X" });
        await db.SaveChangesAsync();

        db.Branches.Add(new Branch { Name = "B", Code = "X" });

        var act = async () => await db.SaveChangesAsync();
        await act.Should().ThrowAsync<DbUpdateException>();
    }

    [Fact]
    public async Task Intake_within_branch_number_uniqueness_is_enforced()
    {
        using var fx = new SqliteFixture();
        using var db = fx.NewContext();

        var branch = new Branch { Name = "Cairo", Code = "CAI" };
        db.Branches.Add(branch);
        await db.SaveChangesAsync();

        db.Intakes.Add(new Intake
        {
            BranchId = branch.Id, Name = "Intake 45", Number = 45,
            StartDate = DateTime.UtcNow, EndDate = DateTime.UtcNow.AddMonths(9)
        });
        await db.SaveChangesAsync();

        db.Intakes.Add(new Intake
        {
            BranchId = branch.Id, Name = "Intake 45 dup", Number = 45,
            StartDate = DateTime.UtcNow, EndDate = DateTime.UtcNow.AddMonths(9)
        });

        var act = async () => await db.SaveChangesAsync();
        await act.Should().ThrowAsync<DbUpdateException>();
    }
}
