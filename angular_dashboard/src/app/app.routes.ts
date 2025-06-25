import { Routes } from '@angular/router';
import { AdminDashboardComponent } from './components/admin-dashboard/admin-dashboard.component'; 
// Update the import to use the correct exported component name
import { UserDashboardComponent } from './components/user-dashboard/user-dashboard.component';
import { CreateIssueComponent } from './components/create-issue/create-issue.component';


export const routes: Routes = [
  { path: '', component: AdminDashboardComponent },
  { path: 'dashboard', component: UserDashboardComponent },
  { path: 'create-issue', component: CreateIssueComponent }
];