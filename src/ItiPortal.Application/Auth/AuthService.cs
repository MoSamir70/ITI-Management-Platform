using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using ItiPortal.Domain.Entities;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;

namespace ItiPortal.Application.Auth;

public class AuthService : IAuthService
{
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly IRefreshTokenStore _refreshStore;
    private readonly IClaimsLookup _claimsLookup;
    private readonly JwtOptions _options;

    public AuthService(
        UserManager<ApplicationUser> userManager,
        IRefreshTokenStore refreshStore,
        IClaimsLookup claimsLookup,
        IOptions<JwtOptions> options)
    {
        _userManager = userManager;
        _refreshStore = refreshStore;
        _claimsLookup = claimsLookup;
        _options = options.Value;
    }

    public async Task<AuthResult<LoginResponse>> LoginAsync(LoginRequest request, string? ip, CancellationToken ct)
    {
        var user = await _userManager.FindByEmailAsync(request.Email);
        if (user is null)
            return AuthResult<LoginResponse>.Fail("invalid_credentials");

        if (!user.IsActive)
            return AuthResult<LoginResponse>.Fail("account_deactivated");

        if (await _userManager.IsLockedOutAsync(user))
            return AuthResult<LoginResponse>.Fail("account_locked");

        if (!await _userManager.CheckPasswordAsync(user, request.Password))
        {
            await _userManager.AccessFailedAsync(user);
            return AuthResult<LoginResponse>.Fail("invalid_credentials");
        }
        await _userManager.ResetAccessFailedCountAsync(user);

        var role = (await _claimsLookup.GetRoleAsync(user.Id, ct)) ?? "Student";
        var (jwt, expiresIn) = BuildJwt(user, role);
        var refreshPlain = await _refreshStore.IssueAsync(user.Id, ip, _options.RefreshTokenDays, ct);

        var resp = new LoginResponse(jwt, expiresIn, role, user.Id, user.FullName, user.MustChangePassword);
        return AuthResult<LoginResponse>.Ok(resp, refreshPlain);
    }

    public async Task<AuthResult<RefreshResponse>> RefreshAsync(string refreshToken, string? ip, CancellationToken ct)
    {
        var rotation = await _refreshStore.RotateAsync(refreshToken, ip, _options.RefreshTokenDays, ct);
        if (!rotation.Success || rotation.User is null)
            return AuthResult<RefreshResponse>.Fail(rotation.ErrorCode ?? "invalid_refresh_token");

        var role = (await _claimsLookup.GetRoleAsync(rotation.User.Id, ct)) ?? "Student";
        var (jwt, expiresIn) = BuildJwt(rotation.User, role);
        return AuthResult<RefreshResponse>.Ok(new RefreshResponse(jwt, expiresIn), rotation.NewPlainToken);
    }

    public async Task<AuthResult> LogoutAsync(string refreshToken, CancellationToken ct)
    {
        await _refreshStore.RevokeAsync(refreshToken, ct);
        return AuthResult.Ok();
    }

    public async Task<AuthResult> ChangePasswordAsync(Guid userId, ChangePasswordRequest request, CancellationToken ct)
    {
        var user = await _userManager.FindByIdAsync(userId.ToString());
        if (user is null) return AuthResult.Fail("user_not_found");

        var result = await _userManager.ChangePasswordAsync(user, request.CurrentPassword, request.NewPassword);
        if (!result.Succeeded)
            return AuthResult.Fail("password_change_failed",
                string.Join("; ", result.Errors.Select(e => e.Description)));

        user.MustChangePassword = false;
        await _userManager.UpdateAsync(user);
        await _refreshStore.RevokeAllForUserAsync(user.Id, ct);
        return AuthResult.Ok();
    }

    public async Task<AuthResult> ForgotPasswordAsync(string email, CancellationToken ct)
    {
        var user = await _userManager.FindByEmailAsync(email);
        if (user is null) return AuthResult.Ok(); // do not leak existence
        var _ = await _userManager.GeneratePasswordResetTokenAsync(user);
        // TODO: ship token to user via email (out of scope for v1; logged for dev)
        return AuthResult.Ok();
    }

    public async Task<AuthResult> ResetPasswordAsync(ResetPasswordRequest request, CancellationToken ct)
    {
        var user = await _userManager.FindByEmailAsync(request.Email);
        if (user is null) return AuthResult.Fail("invalid_reset");
        var result = await _userManager.ResetPasswordAsync(user, request.Token, request.NewPassword);
        if (!result.Succeeded) return AuthResult.Fail("invalid_reset");
        await _refreshStore.RevokeAllForUserAsync(user.Id, ct);
        return AuthResult.Ok();
    }

    private (string token, int expiresIn) BuildJwt(ApplicationUser user, string role)
    {
        var claims = new List<Claim>
        {
            new(JwtRegisteredClaimNames.Sub, user.Id.ToString()),
            new(JwtRegisteredClaimNames.Email, user.Email ?? string.Empty),
            new(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new(ClaimTypes.Email, user.Email ?? string.Empty),
            new(ClaimTypes.Role, role),
            new("role", role),
            new("name", user.FullName),
            new(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString())
        };

        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_options.SigningKey));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);
        var expiresAt = DateTime.UtcNow.AddMinutes(_options.AccessTokenMinutes);
        var token = new JwtSecurityToken(
            _options.Issuer, _options.Audience, claims,
            expires: expiresAt, signingCredentials: creds);

        return (new JwtSecurityTokenHandler().WriteToken(token), _options.AccessTokenMinutes * 60);
    }

    public static string HashToken(string plain)
    {
        var bytes = SHA256.HashData(Encoding.UTF8.GetBytes(plain));
        return Convert.ToHexString(bytes);
    }
}

public interface IClaimsLookup
{
    Task<string?> GetRoleAsync(Guid userId, CancellationToken ct);
}

public interface IRefreshTokenStore
{
    Task<string> IssueAsync(Guid userId, string? ip, int days, CancellationToken ct);
    Task<RefreshRotationResult> RotateAsync(string plainToken, string? ip, int days, CancellationToken ct);
    Task RevokeAsync(string plainToken, CancellationToken ct);
    Task RevokeAllForUserAsync(Guid userId, CancellationToken ct);
}

public record RefreshRotationResult(
    bool Success,
    string? NewPlainToken,
    ApplicationUser? User,
    string? ErrorCode);
