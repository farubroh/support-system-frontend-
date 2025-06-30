import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-issue-view-modal-admin',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './issue-view-modal-admin.component.html',
  styleUrls: ['./issue-view-modal-admin.component.css']
})
export class IssueViewModalAdminComponent {
  @Input() issue: any;
  @Output() close = new EventEmitter<void>();
  @Output() refresh = new EventEmitter<void>();

  selectedDeveloperId: number = 0;
  developers: any[] = [];

  constructor(private http: HttpClient) {}

  ngOnInit() {
    // Fetch developers from the backend
    this.http.get('http://localhost:8085/api/developers').subscribe({
      next: (res: any) => {
        this.developers = res;  // Developers will have 'id' and 'username' properties
      },
      error: () => alert('Failed to load developers')
    });
  }

  onCloseModal() {
    this.close.emit();
  }

  assignToDeveloper() {
    if (!this.selectedDeveloperId) {
      alert('Please select a developer.');
      return;
    }

    const payload = { developerId: this.selectedDeveloperId };

    // API call to assign the issue to the developer
    this.http.post(`http://localhost:8085/api/issues/${this.issue.id}/assign`, payload).subscribe({
      next: () => {
        alert('Assigned successfully');
        this.issue.status = 'INPROGRESS';  // Update UI to reflect the new status
        this.refresh.emit();              // Notify parent to refresh the issue list
      },
      error: () => alert('Assignment failed')
    });
  }
}
