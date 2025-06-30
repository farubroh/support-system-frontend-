import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CdkDragDrop } from '@angular/cdk/drag-drop';
import { ColumnComponent } from '../column/column.component';
import { CommonModule } from '@angular/common';
import { DragDropModule } from '@angular/cdk/drag-drop';

@Component({
  selector: 'app-developer-dashboard',
  standalone: true,
  imports: [CommonModule, DragDropModule, ColumnComponent],
  templateUrl: './developer-dashboard.component.html',
  styleUrls: ['./developer-dashboard.component.css']
})
export class DeveloperDashboardComponent implements OnInit {
  user: any;
  issuesByStatus: { [key: string]: any[] } = {
    PENDING: [],
    INPROGRESS: [],
    COMPLETED: [],
    REJECTED: []
  };

  statusOrder = ['PENDING', 'INPROGRESS', 'COMPLETED', 'REJECTED'];

  constructor(private http: HttpClient) {}

  ngOnInit() {
    const storedUser = sessionStorage.getItem('helpdeskUser');
    if (storedUser) {
      this.user = JSON.parse(storedUser);
      this.fetchIssues();
    } else {
      console.error('No user found in sessionStorage');
    }
  }

  // fetchIssues() {
  //   const developerId = this.user.id;
  //   const url = `http://localhost:8085/api/developers/${developerId}/issues`;
  //   this.http.get<any>(url).subscribe({
  //     next: (res) => {
  //       this.issuesByStatus['PENDING'] = res.pendingIssues || [];
  //       this.issuesByStatus['INPROGRESS'] = res.ongoingIssues || [];
  //       this.issuesByStatus['COMPLETED'] = res.completedIssues || [];
  //       this.issuesByStatus['REJECTED'] = res.rejectedIssues || [];
  //     },
  //     error: (err) => {
  //       console.error('Failed to load developer issues:', err);
  //     }
  //   });
  // }

  fetchIssues() {
  const developerId = this.user.id;
  const url = `http://localhost:8085/api/developers/${developerId}/issues`;
  this.http.get<any>(url).subscribe({
    next: (res) => {
      this.issuesByStatus['PENDING'] = (res.pendingIssues || []).map((i: any) => ({
        ...i.issue,
        createdBy: i.createdBy.username
      }));
      this.issuesByStatus['INPROGRESS'] = (res.ongoingIssues || []).map((i: any) => ({
        ...i.issue,
        createdBy: i.createdBy.username
      }));
      this.issuesByStatus['COMPLETED'] = (res.completedIssues || []).map((i: any) => ({
        ...i.issue,
        createdBy: i.createdBy.username
      }));
      this.issuesByStatus['REJECTED'] = (res.rejectedIssues || []).map((i: any) => ({
        ...i.issue,
        createdBy: i.createdBy.username
      }));
    },
    error: (err) => {
      console.error('Failed to load developer issues:', err);
    }
  });
}


  getDropHandler(targetStatus: string) {
    return (event: CdkDragDrop<any[]>) => {
      if (event.previousContainer === event.container) return;

      const movedIssue = event.previousContainer.data[event.previousIndex];
      this.updateIssueStatus(movedIssue.issue.issueId, targetStatus);
    };
  }

  // updateIssueStatus(issueId: number, newStatus: string) {
  //   const payload = {
  //     fromStatus: null, // Can be tracked if needed
  //     toStatus: newStatus,
  //     workedBy: this.user.id,
  //     completedAnalysis: 'Auto-completed by drag', // default reason for demo
  //     rejectionReason: 'Auto-rejected by drag'
  //   };

  //   this.http.put(`http://localhost:8085/api/issues/${issueId}/status`, payload)
  //     .subscribe({
  //       next: () => this.fetchIssues(),
  //       error: err => console.error('Status update failed:', err)
  //     });
  // }
  updateIssueStatus(issueId: number, newStatus: string) {
  const payload = {
    toStatus: newStatus,
    workedBy: this.user.id,
    completedAnalysis: 'Marked as completed by developer',
    rejectionReason: 'Marked as rejected by developer'
  };

  this.http.put(`http://localhost:8085/api/issues/${issueId}/status`, payload)
    .subscribe({
      next: () => this.fetchIssues(),
      error: err => console.error('Status update failed:', err)
    });
}

}
