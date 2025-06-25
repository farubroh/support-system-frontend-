import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';

import { IssueViewModalAdminComponent } from '../issue-view-modal-admin/issue-view-modal-admin.component';
import { animate, style, transition, trigger } from '@angular/animations';
import { HttpClient } from '@angular/common/http';



interface Issue {
  id: number;
  serialId: string;
  status: string;
  
}

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [ CommonModule, IssueViewModalAdminComponent ],
  templateUrl: './admin-dashboard.component.html',
  styleUrls: ['./admin-dashboard.component.css'],
  animations: [
    trigger('fadeIn', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(-10px)' }),
        animate('300ms ease-out', style({ opacity: 1, transform: 'translateY(0)' })),
      ]),
    ]),
  ],
})
export class AdminDashboardComponent implements OnInit {
  http = inject(HttpClient);

  user = { username: 'Admin', role: 'ADMIN' }; 
  issues: Issue[] = [];
  activeTab: string = 'PENDING';
  loading: boolean = true;
  selectedIssue: Issue | null = null;

  statusTabs = [
    { key: 'PENDING', label: 'Pending' },
    { key: 'INPROGRESS', label: 'In Progress' },
    { key: 'COMPLETED', label: 'Completed' },
    { key: 'REJECTED', label: 'Rejected' },
  ];

  ngOnInit() {
    this.fetchIssues();
  }

  onTabClick(key: string) {
    this.activeTab = key;
    this.fetchIssues();
  }

  fetchIssues() {
    this.loading = true;
    this.http.get<Issue[]>(`http://localhost:8085/api/issues/status/${this.activeTab}`)
      .subscribe({
        next: data => this.issues = data,
        error: err => {
          console.error('Error fetching issues:', err);
          this.issues = [];
        },
        complete: () => this.loading = false,
      });
  }

  getStatusColor(status: string): string {
    switch (status) {
      case 'PENDING': return '#ffc107';
      case 'INPROGRESS': return '#17a2b8';
      case 'COMPLETED': return '#28a745';
      case 'REJECTED': return '#dc3545';
      default: return '#6c757d';
    }
  }

  openModal(issue: Issue) {
    this.selectedIssue = issue;
  }

  closeModal() {
    this.selectedIssue = null;
    this.fetchIssues();
  }
}
