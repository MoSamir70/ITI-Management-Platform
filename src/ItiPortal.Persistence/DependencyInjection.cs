using ItiPortal.Application.Auth;
using ItiPortal.Domain.Entities;
using ItiPortal.Persistence.Auth;
using ItiPortal.Persistence.Interceptors;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace ItiPortal.Persistence;

public static class DependencyInjection
{
    public static IServiceCollection AddPersistence(this IServiceCollection services, IConfiguration config)
    {
        services.AddSingleton<AuditableInterceptor>();

        services.AddDbContext<AppDbContext>((sp, options) =>
        {
            options.UseSqlServer(config.GetConnectionString("DefaultConnection"));
            options.AddInterceptors(sp.GetRequiredService<AuditableInterceptor>());
        });

        services.AddIdentityCore<ApplicationUser>(opts =>
            {
                opts.Password.RequireDigit = true;
                opts.Password.RequireUppercase = true;
                opts.Password.RequireNonAlphanumeric = true;
                opts.Password.RequiredLength = 8;
                opts.User.RequireUniqueEmail = true;
                opts.Lockout.MaxFailedAccessAttempts = 5;
                opts.Lockout.DefaultLockoutTimeSpan = TimeSpan.FromMinutes(15);
            })
            .AddRoles<ApplicationRole>()
            .AddEntityFrameworkStores<AppDbContext>()
            .AddDefaultTokenProviders();

        services.AddScoped<IRefreshTokenStore, RefreshTokenStore>();
        services.AddScoped<IClaimsLookup, ClaimsLookup>();
        services.AddScoped<ItiPortal.Application.Users.IUserQueryRepository, ItiPortal.Persistence.Users.UserQueryRepository>();
        services.AddScoped<ItiPortal.Application.Org.IBranchService, ItiPortal.Persistence.Org.BranchService>();
        services.AddScoped<ItiPortal.Application.Org.IIntakeService, ItiPortal.Persistence.Org.IntakeService>();
        services.AddScoped<ItiPortal.Application.Academic.ITrackService, ItiPortal.Persistence.Academic.TrackService>();
        services.AddScoped<ItiPortal.Application.Academic.ICourseService, ItiPortal.Persistence.Academic.CourseService>();

        return services;
    }
}
