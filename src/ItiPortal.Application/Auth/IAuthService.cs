namespace ItiPortal.Application.Auth;

public interface IAuthService
{
    Task<AuthResult<LoginResponse>> LoginAsync(LoginRequest request, string? ip, CancellationToken ct);
    Task<AuthResult<RefreshResponse>> RefreshAsync(string refreshToken, string? ip, CancellationToken ct);
    Task<AuthResult> LogoutAsync(string refreshToken, CancellationToken ct);
    Task<AuthResult> ChangePasswordAsync(Guid userId, ChangePasswordRequest request, CancellationToken ct);
    Task<AuthResult> ForgotPasswordAsync(string email, CancellationToken ct);
    Task<AuthResult> ResetPasswordAsync(ResetPasswordRequest request, CancellationToken ct);
}

public record AuthResult(bool Success, string? ErrorCode = null, string? ErrorDescription = null)
{
    public static AuthResult Ok() => new(true);
    public static AuthResult Fail(string code, string? description = null) => new(false, code, description);
}

public record AuthResult<T>(bool Success, T? Value, string? ErrorCode = null, string? ErrorDescription = null, string? RefreshToken = null)
{
    public static AuthResult<T> Ok(T value, string? refreshToken = null) => new(true, value, RefreshToken: refreshToken);
    public static AuthResult<T> Fail(string code, string? description = null) => new(false, default, code, description);
}
