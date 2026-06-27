using System.Security.Claims;
using ItiPortal.Application.Attendance;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ItiPortal.Api.Controllers.Attendance;

[ApiController]
[Route("api/v1")]
[Authorize]
public class AttendanceController : ControllerBase
{
    private readonly IAttendanceService _svc;
    public AttendanceController(IAttendanceService svc) => _svc = svc;

    [HttpPost("courses/{courseId:int}/groups/{groupId:int}/attendance")]
    public async Task<IActionResult> RecordSession(int courseId, int groupId, [FromBody] RecordSessionRequest req, CancellationToken ct)
    {
        var (a, r) = Actor();
        var res = await _svc.RecordSessionAsync(courseId, groupId, req, a, r ?? "", ct);
        if (!res.Success) return res.ErrorCode == "forbidden" ? Forbid() : NotFound();
        return NoContent();
    }

    [HttpGet("courses/{courseId:int}/groups/{groupId:int}/attendance")]
    public async Task<IActionResult> ListSessions(int courseId, int groupId, CancellationToken ct)
    {
        var (a, r) = Actor();
        var res = await _svc.ListSessionsAsync(courseId, groupId, a, r ?? "", ct);
        if (!res.Success) return res.ErrorCode == "forbidden" ? Forbid() : NotFound();
        return Ok(res.Value);
    }

    [HttpGet("courses/{courseId:int}/groups/{groupId:int}/attendance/{date}/{ordinal:int}")]
    public async Task<IActionResult> GetSession(int courseId, int groupId, DateTime date, int ordinal, CancellationToken ct)
    {
        var (a, r) = Actor();
        var res = await _svc.GetSessionAttendanceAsync(courseId, groupId, date, ordinal, a, r ?? "", ct);
        if (!res.Success) return res.ErrorCode == "forbidden" ? Forbid() : NotFound();
        return Ok(res.Value);
    }

    [HttpGet("students/{studentId:guid}/attendance")]
    public async Task<IActionResult> GetStudentAttendance(Guid studentId, CancellationToken ct)
    {
        var (a, r) = Actor();
        var res = await _svc.GetStudentAttendanceAsync(studentId, a, r ?? "", ct);
        if (!res.Success) return res.ErrorCode == "forbidden" ? Forbid() : NotFound();
        return Ok(res.Value);
    }

    [HttpGet("students/me/attendance")]
    public async Task<IActionResult> GetMyAttendance(CancellationToken ct)
    {
        var (a, r) = Actor();
        var res = await _svc.GetStudentAttendanceAsync(a, a, r ?? "", ct);
        return Ok(res.Value ?? new List<StudentAttendanceSummaryDto>());
    }

    // Absence requests
    [HttpPost("absence-requests")]
    public async Task<IActionResult> SubmitRequest([FromBody] CreateAbsenceRequestRequest req, CancellationToken ct)
    {
        var (a, _) = Actor();
        var res = await _svc.SubmitAbsenceRequestAsync(req, a, ct);
        if (!res.Success) return BadRequest(new { code = res.ErrorCode });
        return CreatedAtAction(nameof(GetRequest), new { id = res.Value }, new { id = res.Value });
    }

    [HttpGet("absence-requests")]
    public async Task<IActionResult> ListRequests(CancellationToken ct)
    {
        var (a, r) = Actor();
        var res = await _svc.ListAbsenceRequestsAsync(a, r ?? "", ct);
        if (!res.Success) return res.ErrorCode == "forbidden" ? Forbid() : NotFound();
        return Ok(res.Value);
    }

    [HttpPatch("absence-requests/{id:int}/review")]
    public async Task<IActionResult> GetRequest(int id, [FromBody] ReviewAbsenceRequestRequest req, CancellationToken ct)
    {
        var (a, r) = Actor();
        var res = await _svc.ReviewAbsenceRequestAsync(id, req, a, r ?? "", ct);
        if (!res.Success)
        {
            if (res.ErrorCode == "forbidden") return Forbid();
            if (res.ErrorCode == "not_found") return NotFound();
            return Conflict(new { code = res.ErrorCode });
        }
        return NoContent();
    }

    private (Guid actor, string? role) Actor()
    {
        var id = Guid.TryParse(User.FindFirstValue(ClaimTypes.NameIdentifier), out var g) ? g : Guid.Empty;
        return (id, User.FindFirstValue(ClaimTypes.Role));
    }
}
