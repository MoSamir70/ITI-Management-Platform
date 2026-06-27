using System.Security.Claims;
using ItiPortal.Api.Authorization;
using ItiPortal.Application.Groups;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ItiPortal.Api.Controllers.Groups;

[ApiController]
[Route("api/v1")]
[Authorize]
public class GroupsController : ControllerBase
{
    private readonly IGroupService _groups;
    public GroupsController(IGroupService groups) => _groups = groups;

    [HttpGet("tracks/{trackId:int}/groups")]
    [Authorize(Policy = Policies.IsStaff)]
    public async Task<IActionResult> List(int trackId, CancellationToken ct)
        => Ok((await _groups.ListAsync(trackId, ct)).Value);

    [HttpPost("tracks/{trackId:int}/groups")]
    [Authorize(Policy = Policies.IsStaff)]
    public async Task<IActionResult> Create(int trackId, [FromBody] CreateGroupRequest req, CancellationToken ct)
    {
        var (a, r) = Actor();
        var res = await _groups.CreateAsync(trackId, req, a, r ?? "", ct);
        if (!res.Success || res.Value is null)
        {
            var s = res.ErrorCode switch
            {
                "track_not_found" => 404,
                "forbidden" => 403,
                "group_name_exists_in_track" => 409,
                _ => 400
            };
            return Problem(statusCode: s, title: res.ErrorCode);
        }
        return Created($"/api/v1/groups/{res.Value.Id}", res.Value);
    }

    [HttpPut("groups/{id:int}")]
    [Authorize(Policy = Policies.IsStaff)]
    public async Task<IActionResult> Update(int id, [FromBody] UpdateGroupRequest req, CancellationToken ct)
    {
        var (a, r) = Actor();
        var res = await _groups.UpdateAsync(id, req, a, r ?? "", ct);
        if (!res.Success) return res.ErrorCode == "not_found" ? NotFound() : Problem(statusCode: 400, title: res.ErrorCode);
        return NoContent();
    }

    [HttpPatch("groups/{id:int}/archive")]
    [Authorize(Policy = Policies.IsStaff)]
    public async Task<IActionResult> Archive(int id, CancellationToken ct)
    {
        var (a, r) = Actor();
        var res = await _groups.ArchiveAsync(id, a, r ?? "", ct);
        if (!res.Success)
        {
            var s = res.ErrorCode switch { "not_found" => 404, "group_has_students" => 409, "forbidden" => 403, _ => 400 };
            return Problem(statusCode: s, title: res.ErrorCode);
        }
        return NoContent();
    }

    [HttpGet("groups/{id:int}/tas")]
    [Authorize(Policy = Policies.IsStaff)]
    public async Task<IActionResult> ListTas(int id, CancellationToken ct)
        => Ok((await _groups.ListTasAsync(id, ct)).Value);

    [HttpPost("groups/{id:int}/tas")]
    [Authorize(Policy = Policies.IsStaff)]
    public async Task<IActionResult> AssignTa(int id, [FromBody] AssignTaRequest req, CancellationToken ct)
    {
        var (a, r) = Actor();
        var res = await _groups.AssignTaAsync(id, req, a, r ?? "", ct);
        if (!res.Success)
        {
            var s = res.ErrorCode switch
            {
                "not_found" or "ta_not_found" => 404,
                "invalid_ta_role" => 400,
                "ta_already_assigned" => 409,
                "forbidden" => 403,
                _ => 400
            };
            return Problem(statusCode: s, title: res.ErrorCode);
        }
        return NoContent();
    }

    [HttpDelete("groups/{id:int}/tas/{userId:guid}")]
    [Authorize(Policy = Policies.IsStaff)]
    public async Task<IActionResult> RemoveTa(int id, Guid userId, CancellationToken ct)
    {
        var (a, r) = Actor();
        var res = await _groups.RemoveTaAsync(id, userId, a, r ?? "", ct);
        return res.Success ? NoContent() : NotFound();
    }

    [HttpGet("groups/{id:int}/students")]
    [Authorize(Policy = Policies.IsStaff)]
    public async Task<IActionResult> ListStudents(int id, CancellationToken ct)
    {
        var (a, r) = Actor();
        var res = await _groups.ListStudentsAsync(id, a, r ?? "", ct);
        return res.Success ? Ok(res.Value) : NotFound();
    }

    private (Guid actor, string? role) Actor()
    {
        var id = Guid.TryParse(User.FindFirstValue(ClaimTypes.NameIdentifier), out var g) ? g : Guid.Empty;
        return (id, User.FindFirstValue(ClaimTypes.Role));
    }
}
