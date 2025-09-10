// app.route.ts
import { Routes } from '@angular/router';
import { AdminDashboardComponent } from './components/admin-dashboard/admin-dashboard.component';
import { DashboardComponent } from './components/user-dashboard/user-dashboard.component';
import { CreateIssueComponent } from './components/create-issue/create-issue.component';
import { IssueTableComponent } from './components/issue-table/issue-table.component';
import { DeveloperDashboardComponent } from './developers/developer-dashboard/developer-dashboard.component';
import { LoginComponent } from './components/login/login.component';
import { AuthGuard } from './auth.guard';
import { HomepageComponent } from './components/homepage/homepage.component';

export const routes: Routes = [
  { path: '', component: HomepageComponent },
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'dashboard', component: DashboardComponent, canActivate: [AuthGuard] },
  { path: 'admin', component: AdminDashboardComponent, canActivate: [AuthGuard] },
  { path: 'create-issue', component: CreateIssueComponent, canActivate: [AuthGuard] },
  { path: 'table-test', component: IssueTableComponent, canActivate: [AuthGuard] },
  { path: 'developer', component: DeveloperDashboardComponent, canActivate: [AuthGuard] },
];
