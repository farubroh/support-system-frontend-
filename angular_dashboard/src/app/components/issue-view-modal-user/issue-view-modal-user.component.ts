import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-issue-view-modal-user',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './issue-view-modal-user.component.html',
  styleUrls: ['./issue-view-modal-user.component.css']
})
export class IssueViewModalUserComponent {
  @Input() issue: any;
  @Output() close = new EventEmitter<void>();

  get developerLabel(): string {
  if (!this.issue) return 'Developer';
  switch (this.issue.status) {
    case 'INPROGRESS': return 'Working On';
    case 'COMPLETED': return 'Resolved By';
    case 'REJECTED': return 'Rejected By';
    default: return '';  // Hide label in PENDING
  }
}

get developerValue(): string {
  if (!this.issue) return '';
  return ['INPROGRESS', 'COMPLETED', 'REJECTED'].includes(this.issue.status)
    ? this.issue.developerName ?? '-'
    : '';
}


  onCloseModal() {
    this.close.emit();
  }
}
