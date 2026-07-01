import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { BranchDto, IntakeDto } from '../models/org.models';

@Injectable({ providedIn: 'root' })
export class OrgService {
  private readonly base = `${environment.apiBase}/branches`;
  constructor(private http: HttpClient) {}

  listBranches(): Observable<BranchDto[]> {
    return this.http.get<BranchDto[]>(this.base);
  }
  listIntakes(branchId: number): Observable<IntakeDto[]> {
    return this.http.get<IntakeDto[]>(`${this.base}/${branchId}/intakes`);
  }
}
