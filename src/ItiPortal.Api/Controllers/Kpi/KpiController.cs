using System.Security.Claims;
using ItiPortal.Application.Kpi;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ItiPortal.Api.Controllers.Kpi;

[ApiController]
[Route("api/v1/kpi")]
[Authorize]
public class KpiController : ControllerBase
{
    private readonly IKpiService _svc;
    public KpiController(IKpiService svc) => _svc = svc;

    [HttpPost]
    public async Task<IActionResult> Submit([FromBody] SubmitKpiRequest req, CancellationToken ct)
    {
        var (a, _) = Actor();
        var res = await _svc.SubmitAsync(req, a, ct);
        if (!res.Success) return BadRequest(new { code = res.ErrorCode });
        return CreatedAtAction(nameof(Get), new { id = res.Value }, new { id = res.Value });
    }

    [HttpGet("me")]
    public async Task<IActionResult> GetMine(CancellationToken ct)
    {
        var (a, _) = Actor();
        var res = await _svc.GetMyKpisAsync(a, ct);
        return Ok(res.Value ?? new List<KpiDto>());
    }

    [HttpGet("pending")]
    public async Task<IActionResult> ListPending(CancellationToken ct)
    {
        var (a, r) = Actor();
        var res = await _svc.ListPendingAsync(a, r ?? "", ct);
        if (!res.Success) return Forbid();
        return Ok(res.Value);
    }

    [HttpGet("{id:int}")]
    public async Task<IActionResult> Get(int id, CancellationToken ct)
    {
        var (a, r) = Actor();
        var res = await _svc.GetAsync(id, a, r ?? "", ct);
        if (!res.Success) return res.ErrorCode == "forbidden" ? Forbid() : NotFound();
        return Ok(res.Value);
    }

    [HttpPatch("{id:int}/review")]
    public async Task<IActionResult> Review(int id, [FromBody] ReviewKpiRequest req, CancellationToken ct)
    {
        var (a, r) = Actor();
        var res = await _svc.ReviewAsync(id, req, a, r ?? "", ct);
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
