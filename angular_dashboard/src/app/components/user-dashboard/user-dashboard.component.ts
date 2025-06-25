import { Component, inject, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { IssueViewModalAdminComponent } from '../issue-view-modal-admin/issue-view-modal-admin.component';

interface Issue {
  id: number;
  serialId: string;
  status: string;
}

@Component({
  selector: 'app-user-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, HttpClientModule, IssueViewModalAdminComponent],
  templateUrl: './user-dashboard.component.html',
  styleUrls: ['./user-dashboard.component.css'],
})
export class UserDashboardComponent implements OnInit {
  @Input() user!: { id: number; username: string; role: string };

  issues: Issue[] = [];
  activeTab = 'PENDING';
  loading = true;
  selectedIssue: Issue | null = null;

  http = inject(HttpClient);
  router = inject(Router);

  statusTabs = [
    { key: 'PENDING', label: 'Pending' },
    { key: 'INPROGRESS', label: 'In Progress' },
    { key: 'COMPLETED', label: 'Completed' },
    { key: 'REJECTED', label: 'Rejected' }
  ];

  ngOnInit() {
    this.fetchIssues();
  }

  fetchIssues() {
    this.loading = true;
    this.http.get<Issue[]>(`http://localhost:8085/api/issues/user/${this.user.id}?status=${this.activeTab}`)
      .subscribe({
        next: (data) => this.issues = data,
        error: (err) => {
          console.error('Error fetching issues:', err);
          this.issues = [];
        },
        complete: () => this.loading = false
      });
  }

  onTabClick(tab: string) {
    this.activeTab = tab;
    this.fetchIssues();
  }

  openModal(issue: Issue) {
    this.selectedIssue = issue;
  }

  closeModal() {
    this.selectedIssue = null;
  }

  createNewIssue() {
    this.router.navigate(['/create-issue']);
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
}