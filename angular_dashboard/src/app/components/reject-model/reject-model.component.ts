// Removed duplicate Component import and unused RejectModelComponent


import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClientModule, HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-reject-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule],
 templateUrl: './reject-model.component.html',
  styleUrl: './reject-model.component.css'
  
})
export class RejectModalComponent {
  @Input() issue: any;
  @Input() user: any;
  @Output() onClose = new EventEmitter<void>();
  @Output() onRejected = new EventEmitter<void>();

  reason = '';

  constructor(private http: HttpClient) {}

  reject() {
    if (!this.reason.trim()) {
      alert('Please enter a rejection reason.');
      return;
    }

    const payload = {
      rejectedByRole: this.user.role,
      rejectedById: this.user.id,
      rejectionReason: this.reason
    };

    this.http.post(`http://localhost:8085/api/issues/${this.issue.id}/reject`, payload).subscribe({
      next: () => this.onRejected.emit(),
      error: () => alert('Failed to reject issue.')
    });
  }
}