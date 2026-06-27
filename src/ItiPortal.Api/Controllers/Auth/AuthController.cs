using System.Security.Claims;
using ItiPortal.Application.Auth;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ItiPortal.Api.Controllers.Auth;

[ApiController]
[Route("api/v1/auth")]
public class AuthController : ControllerBase
{
    private const string RefreshCookieName = "refreshToken";
    private readonly IAuthService _auth;

    public AuthController(IAuthService auth) => _auth = auth;

    [AllowAnonymous]
    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginRequest request, CancellationToken ct)
    {
        var ip = HttpContext.Connection.RemoteIpAddress?.ToString();
        var result = await _auth.LoginAsync(request, ip, ct);
        if (!result.Success || result.Value is null || result.RefreshToken is null)
            return Problem(statusCode: 401, type: result.ErrorCode, title: result.ErrorCode ?? "invalid_credentials");

        AppendRefreshCookie(result.RefreshToken);
        return Ok(result.Value);
    }

    [AllowAnonymous]
    [HttpPost("refresh")]
    public async Task<IActionResult> Refresh(CancellationToken ct)
    {
        if (!Request.Cookies.TryGetValue(RefreshCookieName, out var refreshToken) || string.IsNullOrEmpty(refreshToken))
            return Problem(statusCode: 401, title: "missing_refresh_token");

        var ip = HttpContext.Connection.RemoteIpAddress?.ToString();
        var result = await _auth.RefreshAsync(refreshToken, ip, ct);
        if (!result.Success || result.Value is null || result.RefreshToken is null)
        {
            Response.Cookies.Delete(RefreshCookieName);
            return Problem(statusCode: 401, type: result.ErrorCode, title: result.ErrorCode ?? "invalid_refresh_token");
        }

        AppendRefreshCookie(result.RefreshToken);
        return Ok(result.Value);
    }

    [Authorize]
    [HttpPost("logout")]
    public async Task<IActionResult> Logout(CancellationToken ct)
    {
        if (Request.Cookies.TryGetValue(RefreshCookieName, out var refreshToken) && !string.IsNullOrEmpty(refreshToken))
            await _auth.LogoutAsync(refreshToken, ct);
        Response.Cookies.Delete(RefreshCookieName);
        return NoContent();
    }

    [Authorize]
    [HttpPost("change-password")]
    public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordRequest request, CancellationToken ct)
    {
        var userId = ParseUserId();
        if (userId is null) return Unauthorized();
        var result = await _auth.ChangePasswordAsync(userId.Value, request, ct);
        if (!result.Success)
            return Problem(statusCode: 400, type: result.ErrorCode, title: result.ErrorCode ?? "password_change_failed",
                detail: result.ErrorDescription);
        Response.Cookies.Delete(RefreshCookieName);
        return NoContent();
    }

    [AllowAnonymous]
    [HttpPost("forgot-password")]
    public async Task<IActionResult> ForgotPassword([FromBody] ForgotPasswordRequest request, CancellationToken ct)
    {
        await _auth.ForgotPasswordAsync(request.Email, ct);
        return NoContent();
    }

    [AllowAnonymous]
    [HttpPost("reset-password")]
    public async Task<IActionResult> ResetPassword([FromBody] ResetPasswordRequest request, CancellationToken ct)
    {
        var result = await _auth.ResetPasswordAsync(request, ct);
        if (!result.Success)
            return Problem(statusCode: 400, type: result.ErrorCode, title: result.ErrorCode ?? "invalid_reset");
        return NoContent();
    }

    private Guid? ParseUserId()
    {
        var sub = User.FindFirstValue(ClaimTypes.NameIdentifier);
        return Guid.TryParse(sub, out var id) ? id : null;
    }

    private void AppendRefreshCookie(string refreshToken)
    {
        Response.Cookies.Append(RefreshCookieName, refreshToken, new CookieOptions
        {
            HttpOnly = true,
            Secure = true,
            SameSite = SameSiteMode.Strict,
            Expires = DateTimeOffset.UtcNow.AddDays(7),
            Path = "/api/v1/auth"
        });
    }
}
