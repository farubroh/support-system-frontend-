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
  styleUrls: ['./developer-dashboard.component.css'],
})
export class DeveloperDashboardComponent implements OnInit {
  user: any;
  issuesByStatus: { [key: string]: any[] } = {
    PENDING: [],
    INPROGRESS: [],
    COMPLETED: [],
    REJECTED: [],
  };
    

  statusOrder = ['PENDING', 'INPROGRESS', 'COMPLETED', 'REJECTED'];

  constructor(private http: HttpClient) {}

  ngOnInit() {
  const storedUser = sessionStorage.getItem('helpdeskUser');
  console.log("Session User:", storedUser); // 👈 Add this line

  if (storedUser) {
    this.user = JSON.parse(storedUser);
    console.log("Parsed User Object:", this.user); // 👈 Add this line

    this.fetchIssues();
  } else {
    console.error('No user found in sessionStorage');
  }
}


  fetchIssues() {
  const developerId = this.user.id;
  const url = `http://localhost:8085/api/developers/${developerId}/issues`;
  console.log("Calling developer issue API:", url); // 👈 Add this

  this.http.get<any>(url).subscribe({
    next: (res) => {
      console.log("API Response:", res); // 👈 Add this

      // this.issuesByStatus['PENDING'] = res.PENDING;
      // this.issuesByStatus['INPROGRESS'] = res.INPROGRESS;
      // this.issuesByStatus['COMPLETED'] = res.COMPLETED;
      // this.issuesByStatus['REJECTED'] = res.REJECTED;
      this.issuesByStatus['PENDING'] = res.PENDING.map((d: any) => d.issue);
      this.issuesByStatus['INPROGRESS'] = res.INPROGRESS.map((d: any) => d.issue);
      this.issuesByStatus['COMPLETED'] = res.COMPLETED.map((d: any) => d.issue);
      this.issuesByStatus['REJECTED'] = res.REJECTED.map((d: any) => d.issue);

    },
    error: (err) => {
      console.error('Failed to load developer issues:', err);
    },
  });
}


  // Drag and drop handler to update status when an issue is moved
  // getDropHandler(targetStatus: string) {
  //   return (event: CdkDragDrop<any[]>) => {
  //     if (event.previousContainer === event.container) return;

  //     const movedIssue = event.previousContainer.data[event.previousIndex];
  //     this.updateIssueStatus(movedIssue.issue.issueId, targetStatus);
  //   };
  // }
  getDropHandler(targetStatus: string) {
  return (event: CdkDragDrop<any[]>) => {
    console.log('📦 Drop Event Fired!', event);

    // ✅ ADD THESE DEBUG LINES
    console.log('All Issues By Status:', this.issuesByStatus);
    console.log('Current Container:', event.container.id);
    console.log('Previous Container:', event.previousContainer.id);

    const movedIssue = event.item.data; // ✅ Safely access the issue via cdkDragData

    if (movedIssue?.issueId) {
      console.log('✅ Moving issue:', movedIssue);
      this.updateIssueStatus(movedIssue.issueId, targetStatus);
    } else {
      console.error('❌ Invalid moved issue structure:', movedIssue);
    }
  };
}







  updateIssueStatus(issueId: number, newStatus: string) {
    console.log(`🛠 Updating Issue ID ${issueId} to ${newStatus}`);
    const payload = {
      toStatus: newStatus,
      workedBy: this.user.id,
      completedAnalysis: 'Marked as completed by developer',
      rejectionReason: 'Marked as rejected by developer',
    };

    this.http
      .put(`http://localhost:8085/api/issues/${issueId}/status`, payload)
      .subscribe({
        next: () => this.fetchIssues(),
        error: (err) => console.error('Status update failed:', err),
      });
  }

  handleDrop(data: { event: CdkDragDrop<any[]>, targetStatus: string }) {
  const { event, targetStatus } = data;

  if (event.previousContainer === event.container) return;

  const movedIssue = event.item.data;

  if (movedIssue?.issueId) {
    console.log('✅ Moving issue:', movedIssue);
    this.updateIssueStatus(movedIssue.issueId, targetStatus);
  } else {
    console.error('❌ Invalid moved issue structure:', movedIssue);
  }
}

}
