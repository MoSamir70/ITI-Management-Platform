using ItiPortal.Domain.Entities;
using ItiPortal.Domain.Enums;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace ItiPortal.Persistence.Seed;

public static class DbSeeder
{
    public const string DefaultAdminEmail = "admin@iti.local";
    public const string DefaultAdminPassword = "Admin!2026";

    public static async Task SeedAsync(
        AppDbContext db,
        UserManager<ApplicationUser> userManager,
        RoleManager<ApplicationRole> roleManager,
        CancellationToken ct = default)
    {
        await EnsureRolesAsync(roleManager);
        var admin = await EnsureAdminAsync(userManager);
        await EnsureDefaultBranchAsync(db, admin.Id, ct);
    }

    private static async Task EnsureRolesAsync(RoleManager<ApplicationRole> roleManager)
    {
        foreach (var role in Roles.All)
        {
            if (!await roleManager.RoleExistsAsync(role))
                await roleManager.CreateAsync(new ApplicationRole(role));
        }
    }

    private static async Task<ApplicationUser> EnsureAdminAsync(UserManager<ApplicationUser> userManager)
    {
        var existing = await userManager.FindByEmailAsync(DefaultAdminEmail);
        if (existing is not null) return existing;

        var admin = new ApplicationUser
        {
            UserName = DefaultAdminEmail,
            Email = DefaultAdminEmail,
            EmailConfirmed = true,
            FullName = "Default Training Manager",
            IsActive = true,
            MustChangePassword = true
        };
        var result = await userManager.CreateAsync(admin, DefaultAdminPassword);
        if (!result.Succeeded)
            throw new InvalidOperationException(
                "Failed to seed admin: " + string.Join("; ", result.Errors.Select(e => e.Description)));

        await userManager.AddToRoleAsync(admin, Roles.TrainingManager);
        return admin;
    }

    private static async Task EnsureDefaultBranchAsync(AppDbContext db, Guid adminId, CancellationToken ct)
    {
        if (await db.Branches.AnyAsync(ct)) return;
        db.Branches.Add(new Branch
        {
            Name = "Alexandria",
            Code = "ALX",
            IsActive = true,
            CreatedById = adminId
        });
        await db.SaveChangesAsync(ct);
    }
}
