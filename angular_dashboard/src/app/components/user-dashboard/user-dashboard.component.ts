import { Component, OnInit } from '@angular/core';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';

import { getStatusColor } from '../utils/get-status-color';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, HttpClientModule, RouterModule],
  templateUrl: './user-dashboard.component.html',
  styleUrls: ['./user-dashboard.component.css']
})
export class DashboardComponent implements OnInit {
  issues: any[] = [];
  activeTab: string = 'PENDING';
  loading: boolean = true;
  selectedIssue: any = null;
  user = { id: 1, username: 'User', role: 'User' }; // Replace with actual session user

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
    const url = `http://localhost:8085/api/issues/user/${this.user.id}?status=${this.activeTab}`;
    this.http.get(url)
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