using System.Security.Claims;
using ItiPortal.Api.Authorization;
using ItiPortal.Application.Users;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ItiPortal.Api.Controllers.Users;

[ApiController]
[Route("api/v1/users")]
[Authorize]
public class UsersController : ControllerBase
{
    private readonly IUserService _users;
    public UsersController(IUserService users) => _users = users;

    [HttpGet]
    [Authorize(Policy = Policies.IsTrainingManager)]
    public async Task<IActionResult> List(
        [FromQuery] string? role, [FromQuery] int? branchId, [FromQuery] bool? isActive,
        [FromQuery] string? q, [FromQuery] int page = 1, [FromQuery] int pageSize = 20,
        CancellationToken ct = default)
    {
        var r = await _users.ListAsync(role, branchId, isActive, q, page, pageSize, ct);
        return r.Success ? Ok(r.Value) : Problem(statusCode: 400, title: r.ErrorCode);
    }

    [HttpPost]
    [Authorize(Policy = Policies.IsStaff)]
    public async Task<IActionResult> Create([FromBody] CreateUserRequest request, CancellationToken ct)
    {
        var (actor, role) = (Actor(), ActorRole());
        if (actor is null || role is null) return Unauthorized();
        var r = await _users.CreateAsync(request, actor.Value, role, ct);
        if (!r.Success || r.Value is null)
        {
            var status = r.ErrorCode switch
            {
                "email_already_exists" or "national_id_already_exists" => 409,
                "forbidden_role" or "students_must_be_created_by_student_affairs" => 403,
                _ => 400
            };
            return Problem(statusCode: status, type: r.ErrorCode, title: r.ErrorCode, detail: r.ErrorDescription);
        }
        return Created($"/api/v1/users/{r.Value.Id}", r.Value);
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> Get(Guid id, CancellationToken ct)
    {
        var (actor, role) = (Actor(), ActorRole());
        if (actor is null || role is null) return Unauthorized();
        var r = await _users.GetAsync(id, actor.Value, role, ct);
        if (!r.Success || r.Value is null)
            return r.ErrorCode == "not_found" ? NotFound() : Problem(statusCode: 400);
        return Ok(r.Value);
    }

    [HttpPut("{id:guid}")]
    [Authorize(Policy = Policies.IsStaff)]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateUserRequest request, CancellationToken ct)
    {
        var (actor, role) = (Actor(), ActorRole());
        if (actor is null || role is null) return Unauthorized();
        var r = await _users.UpdateAsync(id, request, actor.Value, role, ct);
        if (!r.Success)
        {
            var status = r.ErrorCode switch
            {
                "not_found" => 404,
                "forbidden" => 403,
                _ => 400
            };
            return Problem(statusCode: status, title: r.ErrorCode);
        }
        return NoContent();
    }

    [HttpPatch("{id:guid}/deactivate")]
    [Authorize(Policy = Policies.IsTrainingManager)]
    public async Task<IActionResult> Deactivate(Guid id, CancellationToken ct)
    {
        var r = await _users.DeactivateAsync(id, ct);
        if (!r.Success)
        {
            var status = r.ErrorCode switch
            {
                "not_found" => 404,
                "has_active_assignments" => 409,
                _ => 400
            };
            return Problem(statusCode: status, title: r.ErrorCode);
        }
        return NoContent();
    }

    [HttpGet("me")]
    public async Task<IActionResult> Me(CancellationToken ct)
    {
        var actor = Actor();
        if (actor is null) return Unauthorized();
        var r = await _users.GetMeAsync(actor.Value, ct);
        return r.Success && r.Value is not null ? Ok(r.Value) : NotFound();
    }

    [HttpPut("me")]
    public async Task<IActionResult> UpdateMe([FromBody] UpdateMyProfileRequest request, CancellationToken ct)
    {
        var actor = Actor();
        if (actor is null) return Unauthorized();
        var r = await _users.UpdateMyProfileAsync(actor.Value, request, ct);
        return r.Success ? NoContent() : Problem(statusCode: 400, title: r.ErrorCode);
    }

    private Guid? Actor() =>
        Guid.TryParse(User.FindFirstValue(ClaimTypes.NameIdentifier), out var id) ? id : null;
    private string? ActorRole() => User.FindFirstValue(ClaimTypes.Role);
}
