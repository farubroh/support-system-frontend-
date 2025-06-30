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
  assigned: any;

  

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

  selectedDeveloperId: number = 0;
developers: any[] = [];

ngOnInit() {
  this.http.get('http://localhost:8085/api/developers').subscribe({
    next: (res: any) => this.developers = res,
    error: () => alert('Failed to load developers')
  });
}

assignToDeveloper() {
  const payload = { developerId: this.selectedDeveloperId };
  this.http.post(`http://localhost:8085/api/issues/${this.issue.id}/assign`, payload).subscribe({
    next: () => {
      alert('Assigned successfully');
      this.issue.status = 'INPROGRESS';  // update UI
      this.assigned.emit();              // notify parent to refresh
    },
    error: () => alert('Assignment failed')
  });
}


}