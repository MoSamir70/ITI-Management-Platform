using System.ComponentModel.DataAnnotations;

namespace ItiPortal.Application.Auth;

public record LoginRequest(
    [Required, EmailAddress] string Email,
    [Required, MinLength(1)] string Password);

public record LoginResponse(
    string AccessToken,
    int ExpiresInSeconds,
    string Role,
    Guid UserId,
    string FullName,
    bool MustChangePassword);

public record ChangePasswordRequest(
    [Required] string CurrentPassword,
    [Required, MinLength(8)] string NewPassword);

public record ForgotPasswordRequest([Required, EmailAddress] string Email);

public record ResetPasswordRequest(
    [Required, EmailAddress] string Email,
    [Required] string Token,
    [Required, MinLength(8)] string NewPassword);

public record RefreshResponse(string AccessToken, int ExpiresInSeconds);

public class JwtOptions
{
    public string SigningKey { get; set; } = string.Empty;
    public string Issuer { get; set; } = "iti-portal";
    public string Audience { get; set; } = "iti-portal";
    public int AccessTokenMinutes { get; set; } = 15;
    public int RefreshTokenDays { get; set; } = 7;
}
