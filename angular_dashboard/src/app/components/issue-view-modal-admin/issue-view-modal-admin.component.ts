import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AssignModalComponent } from '../assign-model/assign-model.component';
import { RejectModalComponent } from '../reject-model/reject-model.component';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { F } from '@angular/cdk/keycodes';



@Component({
  selector: 'app-issue-view-modal-admin',
  standalone: true,
  imports: [CommonModule, AssignModalComponent, RejectModalComponent,FormsModule],
  templateUrl: './issue-view-modal-admin.component.html',
  styleUrls: ['./issue-view-modal-admin.component.css']
})
export class IssueViewModalAdminComponent {
  @Input() issue: any;
  @Output() close = new EventEmitter<void>();
  @Output() refresh = new EventEmitter<void>();

  assignOpen = false;
  rejectOpen = false;
  user = JSON.parse(sessionStorage.getItem('helpdeskUser') || '{}');

  get assigneeLabel(): string {
    switch (this.issue?.status) {
      case 'PENDING': return 'Assigned To';
      case 'INPROGRESS': return 'Assignee';
      case 'COMPLETED': return 'Completed By';
      case 'REJECTED': return 'Rejected By';
      default: return 'Developer';
    }
  }

  get assigneeValue(): string {
    return this.issue?.developerName ?? '-';
  }

  onCloseModal() {
    this.close.emit();
  }

  constructor(private http: HttpClient) {}

  selectedDeveloperId: number | null = null;
developers: any[] = [];

ngOnInit() {
  // Fetch developer list from backend
  this.http.get<any[]>('http://localhost:8085/api/users/developers').subscribe((res: any[]) => {
    this.developers = res;
  });
}

assignToDeveloper() {
  if (!this.selectedDeveloperId) {
    alert('Please select a developer');
    return;
  }

  this.http.post(`http://localhost:8085/api/issues/${this.issue.id}/assign`, {
    developerId: this.selectedDeveloperId
  }).subscribe({
    next: () => {
      alert('✅ Issue assigned successfully');
      this.refresh.emit(); // refresh admin dashboard if needed
      this.close.emit();
    },
    error: () => alert('❌ Failed to assign issue')
  });
}

}