import {
  Component,
  OnInit
} from '@angular/core';
import { HttpClient } from '@angular/common/http';
import {
  CdkDragDrop,
  moveItemInArray,
  transferArrayItem
} from '@angular/cdk/drag-drop';
import { ColumnComponent } from '../column/column.component';
import { CommonModule } from '@angular/common';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { DeveloperIssueModalComponent } from '../developer-issue-modal/developer-issue-modal.component';

@Component({
  selector: 'app-developer-dashboard',
  standalone: true,
  imports: [CommonModule, DragDropModule, ColumnComponent,DeveloperIssueModalComponent],
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
  selectedIssue: any = null;

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

  fetchIssues() {
    const developerId = this.user.id;
    const url = `http://localhost:8085/api/developers/${developerId}/issues`;

    this.http.get<any>(url).subscribe({
      next: (res) => {
        this.issuesByStatus['PENDING'] = res.INPROGRESS.map((d: any) => ({ ...d.issue }));
        this.issuesByStatus['INPROGRESS'] = [];
        this.issuesByStatus['COMPLETED'] = res.COMPLETED.map((d: any) => ({ ...d.issue }));
        this.issuesByStatus['REJECTED'] = res.REJECTED.map((d: any) => ({ ...d.issue }));
      },
      error: (err) => console.error('Failed to load developer issues:', err),
    });
  }

  handleDrop({ event, targetStatus }: { event: CdkDragDrop<any[]>, targetStatus: string }) {
  const prevContainer = event.previousContainer;
  const currContainer = event.container;

  if (prevContainer === currContainer) {
    moveItemInArray(currContainer.data, event.previousIndex, event.currentIndex);
  } else {
    const movedIssue = prevContainer.data[event.previousIndex];

    // ✅ Move issue correctly between arrays
    transferArrayItem(prevContainer.data, currContainer.data, event.previousIndex, event.currentIndex);

    // ✅ Update backend
    if (movedIssue?.issueId) {
      this.updateIssueStatus(movedIssue.issueId, targetStatus);
    }
  }
}


  updateIssueStatus(issueId: number, newStatus: string) {
    const payload = {
      toStatus: newStatus,
      workedBy: this.user.id,
      completedAnalysis: 'Completed by developer',
      rejectionReason: 'Rejected by developer'
    };

    this.http
      .put(`http://localhost:8085/api/issues/${issueId}/status`, payload)
      .subscribe({
        next: () => {
          console.log('✅ Status updated to', newStatus);
        },
        error: (err) => console.error('❌ Failed to update status:', err),
      });
  }
  openIssueModal(issue: any) {
  this.selectedIssue = issue;
}

closeModal() {
  this.selectedIssue = null;
}

refreshAfterAction() {
  this.fetchIssues();
}

}
