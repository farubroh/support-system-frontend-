import { Routes } from '@angular/router';
import { AdminDashboardComponent } from './components/admin-dashboard/admin-dashboard.component'; 
// Update the import to use the correct exported component name
import { DashboardComponent } from './components/user-dashboard/user-dashboard.component';
import { CreateIssueComponent } from './components/create-issue/create-issue.component';
import { IssueTableComponent } from './components/issue-table/issue-table.component';



export const routes: Routes = [
   { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  { path: 'dashboard', component: DashboardComponent },
  { path: 'admin', component: AdminDashboardComponent },
  { path: 'create-issue', component: CreateIssueComponent },
  { path: 'table-test', component: IssueTableComponent } 
];