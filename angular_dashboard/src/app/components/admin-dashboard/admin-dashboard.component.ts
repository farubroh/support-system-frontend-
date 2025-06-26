import { Component, effect, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClientModule, HttpClient } from '@angular/common/http';
// import { getStatusColor } from '../../utils/get-status-color';
import { getStatusColor } from '../utils/get-status-color';
import { IssueViewModalAdminComponent } from "../issue-view-modal-admin/issue-view-modal-admin.component";




@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  templateUrl: './admin-dashboard.component.html',
  styleUrls: ['./admin-dashboard.component.css'],
  imports: [IssueViewModalAdminComponent,CommonModule, HttpClientModule],
  providers: [HttpClient]
})




export class AdminDashboardComponent implements OnInit {
  issues: any[] = [];
  activeTab: string = 'PENDING';
  loading: boolean = true;
  selectedIssue: any = null;
  user = { username: 'Admin', role: 'Admin' }; // Replace with actual session user

  statusTabs = [
    { key: 'PENDING', label: 'Pending' },
    { key: 'INPROGRESS', label: 'In Progress' },
    { key: 'COMPLETED', label: 'Completed' },
    { key: 'REJECTED', label: 'Rejected' }
  ];

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.fetchIssues();
  }

  fetchIssues() {
    this.loading = true;
    this.http.get(`http://localhost:8085/api/issues/status/${this.activeTab}`)
      .subscribe({
        next: (res: any) => this.issues = res,
        error: err => { console.error(err); this.issues = []; },
        complete: () => this.loading = false
      });
  }

  onTabClick(status: string) {
    this.activeTab = status;
    this.fetchIssues();
  }

  getStatusColor = getStatusColor;
}