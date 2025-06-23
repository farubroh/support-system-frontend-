import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';


@Component({
  selector: 'app-issue-view-modal-admin',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './issue-view-modal-admin.component.html',
  styleUrls: ['./issue-view-modal-admin.component.css']
})
export class IssueViewModalAdminComponent {
  @Input() issue!: any;
  @Output() close = new EventEmitter<void>();

  onClose() {
    this.close.emit();
  }
}