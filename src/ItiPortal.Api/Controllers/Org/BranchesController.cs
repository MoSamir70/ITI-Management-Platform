using System.Security.Claims;
using ItiPortal.Api.Authorization;
using ItiPortal.Application.Org;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ItiPortal.Api.Controllers.Org;

[ApiController]
[Route("api/v1/branches")]
[Authorize(Policy = Policies.IsStaff)]
public class BranchesController : ControllerBase
{
    private readonly IBranchService _branches;
    private readonly IIntakeService _intakes;

    public BranchesController(IBranchService branches, IIntakeService intakes)
    {
        _branches = branches;
        _intakes = intakes;
    }

    [HttpGet]
    public async Task<IActionResult> List([FromQuery] bool includeArchived = false, CancellationToken ct = default)
    {
        var r = await _branches.ListAsync(includeArchived, ct);
        return Ok(r.Value);
    }

    [HttpGet("{id:int}")]
    public async Task<IActionResult> Get(int id, CancellationToken ct)
    {
        var r = await _branches.GetAsync(id, ct);
        return r.Success ? Ok(r.Value) : NotFound();
    }

    [HttpPost]
    [Authorize(Policy = Policies.IsTrainingManager)]
    public async Task<IActionResult> Create([FromBody] CreateBranchRequest request, CancellationToken ct)
    {
        var actor = Guid.TryParse(User.FindFirstValue(ClaimTypes.NameIdentifier), out var id) ? id : Guid.Empty;
        var r = await _branches.CreateAsync(request, actor, ct);
        if (!r.Success || r.Value is null)
        {
            var s = r.ErrorCode == "branch_code_exists" ? 409 : 400;
            return Problem(statusCode: s, title: r.ErrorCode);
        }
        return Created($"/api/v1/branches/{r.Value.Id}", r.Value);
    }

    [HttpPut("{id:int}")]
    [Authorize(Policy = Policies.IsTrainingManager)]
    public async Task<IActionResult> Update(int id, [FromBody] UpdateBranchRequest request, CancellationToken ct)
    {
        var r = await _branches.UpdateAsync(id, request, ct);
        if (!r.Success) return r.ErrorCode == "not_found" ? NotFound() : Problem(statusCode: 400, title: r.ErrorCode);
        return NoContent();
    }

    [HttpPatch("{id:int}/archive")]
    [Authorize(Policy = Policies.IsTrainingManager)]
    public async Task<IActionResult> Archive(int id, CancellationToken ct)
    {
        var r = await _branches.ArchiveAsync(id, ct);
        if (!r.Success)
        {
            var s = r.ErrorCode switch { "not_found" => 404, "has_active_intakes" => 409, _ => 400 };
            return Problem(statusCode: s, title: r.ErrorCode);
        }
        return NoContent();
    }

    // Intakes nested under branch
    [HttpGet("{branchId:int}/intakes")]
    public async Task<IActionResult> ListIntakes(int branchId, [FromQuery] bool includeArchived = false, CancellationToken ct = default)
    {
        var r = await _intakes.ListAsync(branchId, includeArchived, ct);
        return Ok(r.Value);
    }

    [HttpPost("{branchId:int}/intakes")]
    [Authorize(Policy = Policies.IsTrainingManager)]
    public async Task<IActionResult> CreateIntake(int branchId, [FromBody] CreateIntakeRequest request, CancellationToken ct)
    {
        var r = await _intakes.CreateAsync(branchId, request, ct);
        if (!r.Success || r.Value is null)
        {
            var s = r.ErrorCode switch
            {
                "branch_not_found" => 404,
                "intake_number_exists_in_branch" => 409,
                "invalid_date_range" => 400,
                _ => 400
            };
            return Problem(statusCode: s, title: r.ErrorCode);
        }
        return Created($"/api/v1/intakes/{r.Value.Id}", r.Value);
    }
}

[ApiController]
[Route("api/v1/intakes")]
[Authorize(Policy = Policies.IsStaff)]
public class IntakesController : ControllerBase
{
    private readonly IIntakeService _intakes;
    public IntakesController(IIntakeService intakes) => _intakes = intakes;

    [HttpGet("{id:int}")]
    public async Task<IActionResult> Get(int id, CancellationToken ct)
    {
        var r = await _intakes.GetAsync(id, ct);
        return r.Success ? Ok(r.Value) : NotFound();
    }

    [HttpPut("{id:int}")]
    [Authorize(Policy = Policies.IsTrainingManager)]
    public async Task<IActionResult> Update(int id, [FromBody] UpdateIntakeRequest request, CancellationToken ct)
    {
        var r = await _intakes.UpdateAsync(id, request, ct);
        if (!r.Success)
        {
            var s = r.ErrorCode switch { "not_found" => 404, "invalid_date_range" => 400, _ => 400 };
            return Problem(statusCode: s, title: r.ErrorCode);
        }
        return NoContent();
    }

    [HttpPatch("{id:int}/archive")]
    [Authorize(Policy = Policies.IsTrainingManager)]
    public async Task<IActionResult> Archive(int id, CancellationToken ct)
    {
        var r = await _intakes.ArchiveAsync(id, ct);
        return r.Success ? NoContent() : NotFound();
    }
}
