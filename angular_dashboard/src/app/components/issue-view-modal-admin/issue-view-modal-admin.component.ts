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

  // Checklist items
  checklistItems = [
    { label: 'Check user ID', done: false },
    { label: 'Verify contact info', done: false },
    { label: 'Review previous issues', done: false }
  ];

  // Comments (static demo)
  newComment = '';
  comments: { author: string; message: string }[] = [
    {
      author: 'Md. Younus Hossain Ahsan',
      message: 'Please check the mail address recovery issue with registrar.'
    },
    {
      author: 'Omar Faruk',
      message: 'Added this card to PENDING.'
    }
  ];

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.http.get('http://localhost:8085/api/developers').subscribe({
      next: (res: any) => {
        this.developers = res;
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

    this.http.post(`http://localhost:8085/api/issues/${this.issue.id}/assign`, payload).subscribe({
      next: () => {
        alert('Assigned successfully');
        this.issue.status = 'INPROGRESS';
        this.refresh.emit();
        this.close.emit();
      },
      error: () => alert('Assignment failed')
    });
  }

  extractFileName(path: string): string {
    return path.split('/').pop() ?? '';
  }

  extractUserId(path: string): string {
    const parts = path.split('/');
    return parts.length > 2 ? parts[parts.length - 2] : '';
  }

  submitComment() {
    if (!this.newComment.trim()) return;
    this.comments.unshift({
      author: 'Admin',
      message: this.newComment.trim()
    });
    this.newComment = '';
  }
}
