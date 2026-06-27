using System.Security.Claims;
using ItiPortal.Application.Notifications;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ItiPortal.Api.Controllers.Notifications;

[ApiController]
[Route("api/v1/notifications")]
[Authorize]
public class NotificationsController : ControllerBase
{
    private readonly INotificationService _svc;
    public NotificationsController(INotificationService svc) => _svc = svc;

    [HttpGet]
    public async Task<IActionResult> GetMine([FromQuery] bool unreadOnly = false, CancellationToken ct = default)
    {
        var userId = UserId();
        var list = await _svc.GetMyNotificationsAsync(userId, unreadOnly, ct);
        return Ok(list);
    }

    [HttpPatch("{id:int}/read")]
    public async Task<IActionResult> MarkRead(int id, CancellationToken ct)
    {
        var res = await _svc.MarkReadAsync(id, UserId(), ct);
        if (!res.Success) return NotFound();
        return NoContent();
    }

    [HttpPatch("read-all")]
    public async Task<IActionResult> MarkAllRead(CancellationToken ct)
    {
        await _svc.MarkAllReadAsync(UserId(), ct);
        return NoContent();
    }

    private Guid UserId() =>
        Guid.TryParse(User.FindFirstValue(ClaimTypes.NameIdentifier), out var g) ? g : Guid.Empty;
}
