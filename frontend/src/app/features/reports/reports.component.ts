import { Component, OnInit, signal } from '@angular/core';
import { catchError, of, switchMap } from 'rxjs';
import { OrgService } from '../../core/services/org.service';
import { TrackService } from '../../core/services/track.service';
import { CourseService } from '../../core/services/course.service';
import { GroupService } from '../../core/services/group.service';
import { UserService } from '../../core/services/user.service';
import { StatCardComponent } from '../../shared/ui/stat-card/stat-card.component';

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [StatCardComponent],
  template: `
    <div class="page-header">
      <div>
        <h1>Reports</h1>
        <p style="color:var(--secondary);font-size:13px;margin-top:4px">Portal-wide summary at a glance.</p>
      </div>
    </div>

    <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:16px">
      <app-stat-card icon="group" [value]="totalStudents()" label="Total Students" />
      <app-stat-card icon="school" [value]="totalPrograms()" label="Programs" />
      <app-stat-card icon="groups" [value]="totalBatches()" label="Batches" />
      <app-stat-card icon="menu_book" [value]="totalCourses()" label="Courses" />
    </div>
  `
})
export class ReportsComponent implements OnInit {
  totalStudents = signal(0);
  totalPrograms = signal(0);
  totalBatches  = signal(0);
  totalCourses  = signal(0);

  constructor(
    private users: UserService,
    private org: OrgService,
    private trackSvc: TrackService,
    private courseSvc: CourseService,
    private groupSvc: GroupService
  ) {}

  ngOnInit() {
    this.users.list({ role: 'Student', page: 1, pageSize: 1 }).subscribe(res => this.totalStudents.set(res.total));

    this.org.listBranches().pipe(
      switchMap(branches => branches[0] ? this.org.listIntakes(branches[0].id) : of([])),
      switchMap(intakes => intakes[0] ? this.trackSvc.list(intakes[0].id) : of([])),
      catchError(() => of([]))
    ).subscribe(tracks => {
      this.totalPrograms.set(tracks.length);
      let courseSum = 0; let batchSum = 0; let remaining = tracks.length;
      if (remaining === 0) return;
      tracks.forEach(t => {
        this.courseSvc.list(t.id).subscribe(courses => {
          courseSum += courses.length;
          this.totalCourses.set(courseSum);
        });
        this.groupSvc.list(t.id).subscribe(groups => {
          batchSum += groups.length;
          this.totalBatches.set(batchSum);
        });
      });
    });
  }
}
