import { Routes } from '@angular/router';
import { AdminDashboardComponent } from './components/admin-dashboard/admin-dashboard.component'; // ✅ Direct import

export const routes: Routes = [
  {
    path: '',
    component: AdminDashboardComponent, // ✅ Show directly
  }
];
