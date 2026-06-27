using System.Security.Claims;
using ItiPortal.Api.Authorization;
using ItiPortal.Application.Grades;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ItiPortal.Api.Controllers.Grades;

[ApiController]
[Route("api/v1")]
[Authorize]
public class GradesController : ControllerBase
{
    private readonly IGradeService _grades;
    public GradesController(IGradeService grades) => _grades = grades;

    [HttpGet("courses/{courseId:int}/grades")]
    public async Task<IActionResult> ListForCourse(int courseId, CancellationToken ct)
    {
        var (a, r) = Actor();
        var res = await _grades.ListForCourseAsync(courseId, a, r ?? "", ct);
        if (!res.Success) return res.ErrorCode == "forbidden" ? Forbid() : NotFound();
        return Ok(res.Value);
    }

    [HttpPut("courses/{courseId:int}/grades/{studentId:guid}/lab")]
    public async Task<IActionResult> SetLab(int courseId, Guid studentId, [FromBody] SetGradeRequest req, CancellationToken ct)
    {
        var (a, r) = Actor();
        var res = await _grades.SetLabAsync(courseId, studentId, req, a, r ?? "", ct);
        return MapWriteResult(res);
    }

    [HttpPut("courses/{courseId:int}/grades/{studentId:guid}/exam")]
    public async Task<IActionResult> SetExam(int courseId, Guid studentId, [FromBody] SetGradeRequest req, CancellationToken ct)
    {
        var (a, r) = Actor();
        var res = await _grades.SetExamAsync(courseId, studentId, req, a, r ?? "", ct);
        return MapWriteResult(res);
    }

    [HttpPatch("courses/{courseId:int}/grades/publish")]
    public async Task<IActionResult> Publish(int courseId, CancellationToken ct)
    {
        var (a, r) = Actor();
        var res = await _grades.PublishAsync(courseId, a, r ?? "", ct);
        if (!res.Success)
        {
            if (res.ErrorCode == "not_found") return NotFound();
            if (res.ErrorCode == "incomplete_grades")
                return Conflict(new { code = res.ErrorCode, missingStudents = res.MissingStudentIds });
            return Problem(statusCode: 400, title: res.ErrorCode);
        }
        return NoContent();
    }

    [HttpGet("students/{studentId:guid}/grades")]
    public async Task<IActionResult> GetStudentGrades(Guid studentId, CancellationToken ct)
    {
        var (a, r) = Actor();
        var res = await _grades.GetStudentGradesAsync(studentId, a, r ?? "", ct);
        if (!res.Success) return res.ErrorCode == "forbidden" ? Forbid() : NotFound();
        return Ok(res.Value);
    }

    [HttpGet("students/me/grades")]
    public async Task<IActionResult> GetMyGrades(CancellationToken ct)
    {
        var (a, r) = Actor();
        var res = await _grades.GetStudentGradesAsync(a, a, r ?? "", ct);
        return Ok(res.Value ?? new List<StudentGradeDto>());
    }

    private IActionResult MapWriteResult(GradeResult res)
    {
        if (res.Success) return NoContent();
        var s = res.ErrorCode switch
        {
            "not_found" or "student_not_enrolled" => 404,
            "forbidden" => 403,
            "lab_grades_not_applicable_for_grading_mode" => 409,
            _ => 400
        };
        return Problem(statusCode: s, title: res.ErrorCode);
    }

    private (Guid actor, string? role) Actor()
    {
        var id = Guid.TryParse(User.FindFirstValue(ClaimTypes.NameIdentifier), out var g) ? g : Guid.Empty;
        return (id, User.FindFirstValue(ClaimTypes.Role));
    }
}
