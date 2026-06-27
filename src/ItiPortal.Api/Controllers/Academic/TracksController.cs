using System.Security.Claims;
using ItiPortal.Api.Authorization;
using ItiPortal.Application.Academic;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ItiPortal.Api.Controllers.Academic;

[ApiController]
[Route("api/v1")]
[Authorize]
public class TracksController : ControllerBase
{
    private readonly ITrackService _tracks;
    public TracksController(ITrackService tracks) => _tracks = tracks;

    [HttpGet("intakes/{intakeId:int}/tracks")]
    [Authorize(Policy = Policies.IsStaff)]
    public async Task<IActionResult> List(int intakeId, CancellationToken ct)
        => Ok((await _tracks.ListAsync(intakeId, ct)).Value);

    [HttpGet("tracks/{id:int}")]
    [Authorize(Policy = Policies.IsStaff)]
    public async Task<IActionResult> Get(int id, CancellationToken ct)
    {
        var r = await _tracks.GetAsync(id, ct);
        return r.Success ? Ok(r.Value) : NotFound();
    }

    [HttpPost("intakes/{intakeId:int}/tracks")]
    [Authorize(Policy = Policies.IsTrainingManager)]
    public async Task<IActionResult> Create(int intakeId, [FromBody] CreateTrackRequest req, CancellationToken ct)
    {
        var r = await _tracks.CreateAsync(intakeId, req, ct);
        if (!r.Success || r.Value is null)
        {
            var s = r.ErrorCode switch
            {
                "intake_not_found" => 404,
                "invalid_supervisor_role" => 400,
                "supervisor_already_assigned_in_intake" => 409,
                _ => 400
            };
            return Problem(statusCode: s, title: r.ErrorCode);
        }
        return Created($"/api/v1/tracks/{r.Value.Id}", r.Value);
    }

    [HttpPut("tracks/{id:int}")]
    [Authorize(Policy = Policies.IsStaff)]
    public async Task<IActionResult> Update(int id, [FromBody] UpdateTrackRequest req, CancellationToken ct)
    {
        var (actor, role) = Actor();
        var r = await _tracks.UpdateAsync(id, req, actor, role ?? "", ct);
        if (!r.Success) return r.ErrorCode == "not_found" ? NotFound()
            : r.ErrorCode == "forbidden" ? Forbid()
            : Problem(statusCode: 400, title: r.ErrorCode);
        return NoContent();
    }

    [HttpPatch("tracks/{id:int}/assign-supervisor")]
    [Authorize(Policy = Policies.IsTrainingManager)]
    public async Task<IActionResult> AssignSupervisor(int id, [FromBody] AssignSupervisorRequest req, CancellationToken ct)
    {
        var r = await _tracks.AssignSupervisorAsync(id, req, ct);
        if (!r.Success)
        {
            var s = r.ErrorCode switch
            {
                "not_found" => 404,
                "supervisor_already_assigned_in_intake" => 409,
                _ => 400
            };
            return Problem(statusCode: s, title: r.ErrorCode);
        }
        return NoContent();
    }

    [HttpPatch("tracks/{id:int}/archive")]
    [Authorize(Policy = Policies.IsTrainingManager)]
    public async Task<IActionResult> Archive(int id, CancellationToken ct)
        => (await _tracks.ArchiveAsync(id, ct)).Success ? NoContent() : NotFound();

    private (Guid actor, string? role) Actor()
    {
        var id = Guid.TryParse(User.FindFirstValue(ClaimTypes.NameIdentifier), out var g) ? g : Guid.Empty;
        return (id, User.FindFirstValue(ClaimTypes.Role));
    }
}

[ApiController]
[Route("api/v1")]
[Authorize]
public class CoursesController : ControllerBase
{
    private readonly ICourseService _courses;
    public CoursesController(ICourseService courses) => _courses = courses;

    [HttpGet("tracks/{trackId:int}/courses")]
    public async Task<IActionResult> List(int trackId, CancellationToken ct)
    {
        var (actor, role) = Actor();
        var r = await _courses.ListAsync(trackId, actor, role ?? "", ct);
        if (!r.Success) return NotFound();
        return Ok(r.Value);
    }

    [HttpPost("tracks/{trackId:int}/courses")]
    [Authorize(Policy = Policies.IsStaff)]
    public async Task<IActionResult> Create(int trackId, [FromBody] CreateCourseRequest req, CancellationToken ct)
    {
        var (actor, role) = Actor();
        var r = await _courses.CreateAsync(trackId, req, actor, role ?? "", ct);
        if (!r.Success || r.Value is null)
        {
            var s = r.ErrorCode switch
            {
                "track_not_found" => 404,
                "forbidden" => 403,
                "hours_out_of_range" => 400,
                _ => 400
            };
            return Problem(statusCode: s, title: r.ErrorCode);
        }
        return Created($"/api/v1/courses/{r.Value.Id}", r.Value);
    }

    [HttpPut("courses/{id:int}")]
    [Authorize(Policy = Policies.IsStaff)]
    public async Task<IActionResult> Update(int id, [FromBody] UpdateCourseRequest req, CancellationToken ct)
    {
        var (actor, role) = Actor();
        var r = await _courses.UpdateAsync(id, req, actor, role ?? "", ct);
        if (!r.Success) return r.ErrorCode == "not_found" ? NotFound() : Problem(statusCode: 400, title: r.ErrorCode);
        return NoContent();
    }

    [HttpPatch("courses/{id:int}/archive")]
    [Authorize(Policy = Policies.IsStaff)]
    public async Task<IActionResult> Archive(int id, CancellationToken ct)
    {
        var (actor, role) = Actor();
        var r = await _courses.ArchiveAsync(id, actor, role ?? "", ct);
        return r.Success ? NoContent() : NotFound();
    }

    private (Guid actor, string? role) Actor()
    {
        var id = Guid.TryParse(User.FindFirstValue(ClaimTypes.NameIdentifier), out var g) ? g : Guid.Empty;
        return (id, User.FindFirstValue(ClaimTypes.Role));
    }
}
