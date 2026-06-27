using System.Security.Claims;
using ItiPortal.Application.Exams;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ItiPortal.Api.Controllers.Exams;

[ApiController]
[Route("api/v1")]
[Authorize]
public class ExamsController : ControllerBase
{
    private readonly IExamService _svc;
    public ExamsController(IExamService svc) => _svc = svc;

    [HttpPost("courses/{courseId:int}/exams")]
    public async Task<IActionResult> Create(int courseId, [FromBody] CreateExamRequest req, CancellationToken ct)
    {
        var (a, r) = Actor();
        var res = await _svc.CreateAsync(courseId, req, a, r ?? "", ct);
        if (!res.Success) return res.ErrorCode == "forbidden" ? Forbid() : NotFound();
        return CreatedAtAction(nameof(Get), new { examId = res.Value!.Id }, res.Value);
    }

    [HttpGet("courses/{courseId:int}/exams")]
    public async Task<IActionResult> ListForCourse(int courseId, CancellationToken ct)
    {
        var (a, r) = Actor();
        var res = await _svc.ListForCourseAsync(courseId, a, r ?? "", ct);
        if (!res.Success) return res.ErrorCode == "forbidden" ? Forbid() : NotFound();
        return Ok(res.Value);
    }

    [HttpGet("exams/{examId:int}")]
    public async Task<IActionResult> Get(int examId, CancellationToken ct)
    {
        var (a, r) = Actor();
        var res = await _svc.GetAsync(examId, a, r ?? "", ct);
        if (!res.Success) return res.ErrorCode == "forbidden" ? Forbid() : NotFound();
        return Ok(res.Value);
    }

    [HttpPut("exams/{examId:int}")]
    public async Task<IActionResult> Update(int examId, [FromBody] UpdateExamRequest req, CancellationToken ct)
    {
        var (a, r) = Actor();
        var res = await _svc.UpdateAsync(examId, req, a, r ?? "", ct);
        if (!res.Success)
        {
            if (res.ErrorCode == "forbidden") return Forbid();
            if (res.ErrorCode == "not_found") return NotFound();
            return Conflict(new { code = res.ErrorCode });
        }
        return NoContent();
    }

    [HttpPatch("exams/{examId:int}/publish")]
    public async Task<IActionResult> Publish(int examId, CancellationToken ct)
    {
        var (a, r) = Actor();
        var res = await _svc.PublishAsync(examId, a, r ?? "", ct);
        if (!res.Success)
        {
            if (res.ErrorCode == "forbidden") return Forbid();
            if (res.ErrorCode == "not_found") return NotFound();
            return Conflict(new { code = res.ErrorCode });
        }
        return NoContent();
    }

    [HttpGet("students/me/exams")]
    public async Task<IActionResult> GetMyExams(CancellationToken ct)
    {
        var (a, _) = Actor();
        var res = await _svc.GetMyExamsAsync(a, ct);
        return Ok(res.Value ?? new List<ExamDto>());
    }

    private (Guid actor, string? role) Actor()
    {
        var id = Guid.TryParse(User.FindFirstValue(ClaimTypes.NameIdentifier), out var g) ? g : Guid.Empty;
        return (id, User.FindFirstValue(ClaimTypes.Role));
    }
}
