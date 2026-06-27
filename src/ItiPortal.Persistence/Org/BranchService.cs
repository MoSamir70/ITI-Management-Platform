using ItiPortal.Application.Org;
using ItiPortal.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace ItiPortal.Persistence.Org;

public class BranchService : IBranchService
{
    private readonly AppDbContext _db;
    public BranchService(AppDbContext db) => _db = db;

    public async Task<OrgResult<IReadOnlyList<BranchDto>>> ListAsync(bool includeArchived, CancellationToken ct)
    {
        var q = _db.Branches.AsNoTracking().AsQueryable();
        if (!includeArchived) q = q.Where(b => b.IsActive);
        var list = await q.OrderBy(b => b.Name)
            .Select(b => new BranchDto(b.Id, b.Name, b.Code, b.IsActive))
            .ToListAsync(ct);
        return OrgResult<IReadOnlyList<BranchDto>>.Ok(list);
    }

    public async Task<OrgResult<BranchDto>> GetAsync(int id, CancellationToken ct)
    {
        var b = await _db.Branches.AsNoTracking().FirstOrDefaultAsync(x => x.Id == id, ct);
        return b is null
            ? OrgResult<BranchDto>.Fail("not_found")
            : OrgResult<BranchDto>.Ok(new BranchDto(b.Id, b.Name, b.Code, b.IsActive));
    }

    public async Task<OrgResult<BranchDto>> CreateAsync(CreateBranchRequest request, Guid actorId, CancellationToken ct)
    {
        if (await _db.Branches.AnyAsync(b => b.Code == request.Code, ct))
            return OrgResult<BranchDto>.Fail("branch_code_exists");

        var b = new Branch { Name = request.Name, Code = request.Code, IsActive = true, CreatedById = actorId };
        _db.Branches.Add(b);
        await _db.SaveChangesAsync(ct);
        return OrgResult<BranchDto>.Ok(new BranchDto(b.Id, b.Name, b.Code, b.IsActive));
    }

    public async Task<OrgResult> UpdateAsync(int id, UpdateBranchRequest request, CancellationToken ct)
    {
        var b = await _db.Branches.FirstOrDefaultAsync(x => x.Id == id, ct);
        if (b is null) return OrgResult.Fail("not_found");
        b.Name = request.Name;
        await _db.SaveChangesAsync(ct);
        return OrgResult.Ok();
    }

    public async Task<OrgResult> ArchiveAsync(int id, CancellationToken ct)
    {
        var b = await _db.Branches.FirstOrDefaultAsync(x => x.Id == id, ct);
        if (b is null) return OrgResult.Fail("not_found");

        var hasActiveIntakes = await _db.Intakes.AnyAsync(i => i.BranchId == id && i.IsActive, ct);
        if (hasActiveIntakes) return OrgResult.Fail("has_active_intakes");

        b.IsActive = false;
        await _db.SaveChangesAsync(ct);
        return OrgResult.Ok();
    }
}

public class IntakeService : IIntakeService
{
    private readonly AppDbContext _db;
    public IntakeService(AppDbContext db) => _db = db;

    public async Task<OrgResult<IReadOnlyList<IntakeDto>>> ListAsync(int branchId, bool includeArchived, CancellationToken ct)
    {
        var q = _db.Intakes.AsNoTracking().Where(i => i.BranchId == branchId);
        if (!includeArchived) q = q.Where(i => i.IsActive);
        var list = await q.OrderByDescending(i => i.Number)
            .Select(i => new IntakeDto(i.Id, i.BranchId, i.Name, i.Number, i.StartDate, i.EndDate, i.IsActive))
            .ToListAsync(ct);
        return OrgResult<IReadOnlyList<IntakeDto>>.Ok(list);
    }

    public async Task<OrgResult<IntakeDto>> GetAsync(int id, CancellationToken ct)
    {
        var i = await _db.Intakes.AsNoTracking().FirstOrDefaultAsync(x => x.Id == id, ct);
        return i is null
            ? OrgResult<IntakeDto>.Fail("not_found")
            : OrgResult<IntakeDto>.Ok(new IntakeDto(i.Id, i.BranchId, i.Name, i.Number, i.StartDate, i.EndDate, i.IsActive));
    }

    public async Task<OrgResult<IntakeDto>> CreateAsync(int branchId, CreateIntakeRequest request, CancellationToken ct)
    {
        if (!await _db.Branches.AnyAsync(b => b.Id == branchId, ct))
            return OrgResult<IntakeDto>.Fail("branch_not_found");

        if (request.EndDate <= request.StartDate)
            return OrgResult<IntakeDto>.Fail("invalid_date_range");

        if (await _db.Intakes.AnyAsync(i => i.BranchId == branchId && i.Number == request.Number, ct))
            return OrgResult<IntakeDto>.Fail("intake_number_exists_in_branch");

        var i = new Intake
        {
            BranchId = branchId,
            Name = request.Name,
            Number = request.Number,
            StartDate = request.StartDate,
            EndDate = request.EndDate,
            IsActive = true
        };
        _db.Intakes.Add(i);
        await _db.SaveChangesAsync(ct);
        return OrgResult<IntakeDto>.Ok(new IntakeDto(i.Id, i.BranchId, i.Name, i.Number, i.StartDate, i.EndDate, i.IsActive));
    }

    public async Task<OrgResult> UpdateAsync(int id, UpdateIntakeRequest request, CancellationToken ct)
    {
        var i = await _db.Intakes.FirstOrDefaultAsync(x => x.Id == id, ct);
        if (i is null) return OrgResult.Fail("not_found");
        if (request.EndDate <= request.StartDate) return OrgResult.Fail("invalid_date_range");
        i.Name = request.Name;
        i.StartDate = request.StartDate;
        i.EndDate = request.EndDate;
        await _db.SaveChangesAsync(ct);
        return OrgResult.Ok();
    }

    public async Task<OrgResult> ArchiveAsync(int id, CancellationToken ct)
    {
        var i = await _db.Intakes.FirstOrDefaultAsync(x => x.Id == id, ct);
        if (i is null) return OrgResult.Fail("not_found");
        i.IsActive = false;
        await _db.SaveChangesAsync(ct);
        return OrgResult.Ok();
    }
}
