import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';

type UiDeveloper = { id: number; username: string };

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

  /** Normalized list for the UI (id + username only). */
  developers: UiDeveloper[] = [];
  assignedDeveloper: UiDeveloper | null = null;
  selectedDeveloper: UiDeveloper | null = null;

  searchQuery = '';
  showAssignBox = false;
  showCommentSidebar = false;

  newComment = '';
  comments: { author: string; message: string }[] = [
    { author: 'Md. Younus Hossain Ahsan', message: 'Please check the mail address recovery issue with registrar.' },
    { author: 'Omar Faruk', message: 'Added this card to PENDING.' }
  ];

  constructor(private http: HttpClient) {}

  ngOnInit() {
    // console.log('ISSUE:', this.issue);
    this.http.get<any[]>('http://localhost:8085/api/developers').subscribe({
      next: (res: any[]) => {
        // 🔧 Normalize backend { id, user:{username,...} } → { id, username }
        this.developers = (res || []).map((d: any) => ({
          id: d?.id,
          username: d?.user?.username ?? d?.username ?? `Developer #${d?.id}`
        }));

        // resolve current developer id from name if needed
        if (!this.issue.developerId && this.issue.developerName) {
          const matched = this.developers.find(dev => dev.username === this.issue.developerName);
          if (matched) this.issue.developerId = matched.id;
        }

        this.assignedDeveloper = this.developers.find(dev => dev.id === this.issue.developerId) ?? null;
      },
      error: () => alert('Failed to load developers')
    });
  }

  toggleAssignBox() {
    this.showAssignBox = !this.showAssignBox;
    this.selectedDeveloper = null;
    this.searchQuery = '';
  }

  toggleCommentSidebar() {
    this.showCommentSidebar = !this.showCommentSidebar;
  }

  selectDeveloper(dev: UiDeveloper) {
    this.selectedDeveloper = dev;
  }

  submitAssignment() {
    if (!this.selectedDeveloper) return;

    const payload = { developerId: this.selectedDeveloper.id };
    this.http.post(`http://localhost:8085/api/issues/${this.issue.id}/assign`, payload).subscribe({
      next: () => {
        this.issue.status = 'INPROGRESS';
        this.issue.developerId = this.selectedDeveloper!.id;
        this.assignedDeveloper = this.selectedDeveloper;
        this.selectedDeveloper = null;
        this.showAssignBox = false;
        this.refresh.emit();
        this.close.emit();
      },
      error: () => alert('Failed to assign developer')
    });
  }

  removeDeveloper() {
    this.issue.developerId = null;
    this.assignedDeveloper = null;
  }

  getDeveloperName(devId: number): string {
    const dev = this.developers.find(d => d.id === devId);
    return dev ? dev.username : '';
  }

  filteredDevelopers(): UiDeveloper[] {
    const q = (this.searchQuery || '').toLowerCase().trim();
    if (!q) return this.developers;
    return this.developers.filter(dev => dev.username.toLowerCase().includes(q));
  }

  onCloseModal() {
    this.close.emit();
  }

  /** NOTE: kept as-is to match your backend handler. */
  markComplete() {
    const payload = {
      status: 'COMPLETED',
      completedReason: 'Marked manually by admin'
    };

    this.http.post(`http://localhost:8085/api/issues/${this.issue.id}/status`, payload).subscribe({
      next: () => {
        this.issue.status = 'COMPLETED';
        this.refresh.emit();
        this.close.emit();
      },
      error: () => alert('Failed to mark as completed.')
    });
  }

  submitComment() {
    if (!this.newComment.trim()) return;
    this.comments.unshift({ author: 'Admin', message: this.newComment.trim() });
    this.newComment = '';
  }
}
