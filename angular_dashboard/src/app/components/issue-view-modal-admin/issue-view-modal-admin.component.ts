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

  developers: any[] = [];
  assignedDeveloper: any = null;
  selectedDeveloper: any = null;
  searchQuery: string = '';
  showAssignBox = false;
  showCommentSidebar = false;

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
    console.log('ISSUE:', this.issue);

    this.http.get('http://localhost:8085/api/developers').subscribe({
      next: (res: any) => {
        this.developers = res;

        if (!this.issue.developerId && this.issue.developerName) {
          const matchedDev = this.developers.find(dev => dev.username === this.issue.developerName);
          if (matchedDev) {
            this.issue.developerId = matchedDev.id;
          }
        }

        this.assignedDeveloper = this.developers.find(dev => dev.id === this.issue.developerId);
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

  selectDeveloper(dev: any) {
    this.selectedDeveloper = dev;
  }

  submitAssignment() {
    if (!this.selectedDeveloper) return;

    const payload = { developerId: this.selectedDeveloper.id };
    this.http.post(`http://localhost:8085/api/issues/${this.issue.id}/assign`, payload).subscribe({
      next: () => {
        this.issue.status = 'INPROGRESS';
        this.issue.developerId = this.selectedDeveloper.id;
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

  filteredDevelopers() {
    return this.developers.filter(dev =>
      dev.username.toLowerCase().includes(this.searchQuery.toLowerCase()) &&
      (!this.issue.developerId || dev.id !== this.issue.developerId)
    );
  }

  onCloseModal() {
    this.close.emit();
  }

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
    this.comments.unshift({
      author: 'Admin',
      message: this.newComment.trim()
    });
    this.newComment = '';
  }
}
