import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AssignModalComponent } from '../assign-model/assign-model.component';
import { RejectModalComponent } from '../reject-model/reject-model.component';




@Component({
  selector: 'app-issue-view-modal-admin',
  standalone: true,
  imports: [CommonModule, AssignModalComponent, RejectModalComponent],
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
}