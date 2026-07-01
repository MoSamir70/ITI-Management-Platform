import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./features/login/login.component').then(m => m.LoginComponent)
  },
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () => import('./layout/shell/shell.component').then(m => m.ShellComponent),
    children: [
      {
        path: 'dashboard',
        loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent)
      },
      {
        path: 'grades',
        loadComponent: () => import('./features/grades/grades.component').then(m => m.GradesComponent)
      },
      {
        path: 'attendance',
        loadComponent: () => import('./features/attendance/attendance.component').then(m => m.AttendanceComponent)
      },
      {
        path: 'exams',
        loadComponent: () => import('./features/exams/exams.component').then(m => m.ExamsComponent)
      },
      {
        path: 'kpi',
        loadComponent: () => import('./features/kpi/kpi.component').then(m => m.KpiComponent)
      },
      {
        path: 'notifications',
        loadComponent: () => import('./features/notifications/notifications.component').then(m => m.NotificationsComponent)
      },
      {
        path: 'students',
        loadComponent: () => import('./features/students/students.component').then(m => m.StudentsComponent)
      },
      {
        path: 'programs',
        loadComponent: () => import('./features/programs/programs.component').then(m => m.ProgramsComponent)
      },
      {
        path: 'courses',
        loadComponent: () => import('./features/courses/courses.component').then(m => m.CoursesComponent)
      },
      {
        path: 'groups',
        loadComponent: () => import('./features/groups/groups.component').then(m => m.GroupsComponent)
      },
      {
        path: 'reports',
        loadComponent: () => import('./features/reports/reports.component').then(m => m.ReportsComponent)
      },
      {
        path: 'settings',
        loadComponent: () => import('./features/settings/settings.component').then(m => m.SettingsComponent)
      },
      {
        path: 'profile',
        loadComponent: () => import('./features/profile/profile.component').then(m => m.ProfileComponent)
      },
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' }
    ]
  },
  { path: '**', redirectTo: '' }
];
