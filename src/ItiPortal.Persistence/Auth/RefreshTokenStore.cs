using ItiPortal.Application.Auth;
using ItiPortal.Domain.Entities;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace ItiPortal.Persistence.Auth;

public class RefreshTokenStore : IRefreshTokenStore
{
    private readonly AppDbContext _db;
    private readonly UserManager<ApplicationUser> _users;

    public RefreshTokenStore(AppDbContext db, UserManager<ApplicationUser> users)
    {
        _db = db;
        _users = users;
    }

    public async Task<string> IssueAsync(Guid userId, string? ip, int days, CancellationToken ct)
    {
        var plain = Guid.NewGuid().ToString("N") + Guid.NewGuid().ToString("N");
        var hash = AuthService.HashToken(plain);
        _db.RefreshTokens.Add(new RefreshToken
        {
            UserId = userId,
            TokenHash = hash,
            ExpiresAt = DateTime.UtcNow.AddDays(days),
            CreatedByIp = ip
        });
        await _db.SaveChangesAsync(ct);
        return plain;
    }

    public async Task<RefreshRotationResult> RotateAsync(string plainToken, string? ip, int days, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(plainToken))
            return new(false, null, null, "invalid_refresh_token");

        var hash = AuthService.HashToken(plainToken);
        var token = await _db.RefreshTokens
            .Include(t => t.User)
            .FirstOrDefaultAsync(t => t.TokenHash == hash, ct);

        if (token is null) return new(false, null, null, "invalid_refresh_token");

        if (token.RevokedAt is not null)
        {
            await RevokeAllForUserAsync(token.UserId, ct); // reuse detection: invalidate chain
            return new(false, null, null, "refresh_token_reused");
        }
        if (token.ExpiresAt < DateTime.UtcNow)
            return new(false, null, null, "refresh_token_expired");
        if (token.User is null || !token.User.IsActive)
            return new(false, null, null, "account_deactivated");

        var newPlain = Guid.NewGuid().ToString("N") + Guid.NewGuid().ToString("N");
        var newHash = AuthService.HashToken(newPlain);

        token.RevokedAt = DateTime.UtcNow;
        token.ReplacedByTokenHash = newHash;

        _db.RefreshTokens.Add(new RefreshToken
        {
            UserId = token.UserId,
            TokenHash = newHash,
            ExpiresAt = DateTime.UtcNow.AddDays(days),
            CreatedByIp = ip
        });
        await _db.SaveChangesAsync(ct);
        return new(true, newPlain, token.User, null);
    }

    public async Task RevokeAsync(string plainToken, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(plainToken)) return;
        var hash = AuthService.HashToken(plainToken);
        var token = await _db.RefreshTokens.FirstOrDefaultAsync(t => t.TokenHash == hash, ct);
        if (token is null || token.RevokedAt is not null) return;
        token.RevokedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync(ct);
    }

    public async Task RevokeAllForUserAsync(Guid userId, CancellationToken ct)
    {
        var tokens = await _db.RefreshTokens
            .Where(t => t.UserId == userId && t.RevokedAt == null)
            .ToListAsync(ct);
        foreach (var t in tokens) t.RevokedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync(ct);
    }
}

public class ClaimsLookup : IClaimsLookup
{
    private readonly UserManager<ApplicationUser> _users;
    public ClaimsLookup(UserManager<ApplicationUser> users) => _users = users;

    public async Task<string?> GetRoleAsync(Guid userId, CancellationToken ct)
    {
        var user = await _users.FindByIdAsync(userId.ToString());
        if (user is null) return null;
        var roles = await _users.GetRolesAsync(user);
        return roles.FirstOrDefault();
    }
}
