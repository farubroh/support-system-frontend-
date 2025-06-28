import { Routes } from '@angular/router';
import { AdminDashboardComponent } from './components/admin-dashboard/admin-dashboard.component';
import { DashboardComponent } from './components/user-dashboard/user-dashboard.component';
import { CreateIssueComponent } from './components/create-issue/create-issue.component';
import { IssueTableComponent } from './components/issue-table/issue-table.component';
import {DeveloperDashboardComponent} from './developers/developer-dashboard/developer-dashboard.component';  
import { LoginComponent } from './components/login/login.component';
export const routes: Routes = [
  //{ path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'dashboard', component: DashboardComponent },
  { path: 'admin', component: AdminDashboardComponent },
  { path: 'create-issue', component: CreateIssueComponent },
  { path: 'table-test', component: IssueTableComponent },
  {path: 'developer', component: DeveloperDashboardComponent },


 
];
  // {
  //   path: 'developer-dashboard',
  //   loadComponent: () =>
  //     import('./developers/developer-dashboard/developer-dashboard.component')
  //       .then(m => m.DeveloperDashboardComponent)
  // }

