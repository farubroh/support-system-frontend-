import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-issue-view-modal-user',
  standalone: true,
  imports: [CommonModule,FormsModule],
  templateUrl: './issue-view-modal-user.component.html',
  styleUrls: ['./issue-view-modal-user.component.css']
})
export class IssueViewModalUserComponent {
  @Input() issue: any;
  @Output() close = new EventEmitter<void>();
  // issue-view-modal-user.component.ts
@Input() files: string[] | null = null;


  showCommentSidebar = true;
  newComment = '';
  comments: { author: string; message: string }[] = [
    {
      author: 'Admin',
      message: 'Please wait while we review your issue.'
    }
  ];
  ngOnInit() {
  console.log(this.issue); // Check if 'completedReason' and 'rejectionReason' are populated
}


  toggleCommentSidebar() {
    this.showCommentSidebar = !this.showCommentSidebar;
  }

  submitComment() {
    if (!this.newComment.trim()) return;

    this.comments.unshift({
      author: 'You',
      message: this.newComment.trim()
    });
    this.newComment = '';
  }

  onCloseModal() {
    this.close.emit();
  }

}
