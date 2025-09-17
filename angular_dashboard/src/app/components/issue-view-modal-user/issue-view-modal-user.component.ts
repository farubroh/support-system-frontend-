import { Component, EventEmitter, Input, Output, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { AuthenticationService } from '../../authentication.service'; // adjust path

@Component({
  selector: 'app-issue-view-modal-user',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './issue-view-modal-user.component.html',
  styleUrls: ['./issue-view-modal-user.component.css']
})
export class IssueViewModalUserComponent implements OnInit {
  @Input() issue: any;
  @Input() files: string[] | null = null;
  @Output() close = new EventEmitter<void>();

  showCommentSidebar = true;
  newComment = '';
  comments: { author: string; message: string }[] = [];

  constructor(private http: HttpClient, private auth: AuthenticationService) {}

  private authHeader() {
    const token = this.auth.getToken(); // <-- single source of truth
    return token ? new HttpHeaders({ Authorization: `Bearer ${token}` }) : new HttpHeaders();
  }

  ngOnInit() {
    this.loadComments();
    console.log(this.issue); // Check if 'completedReason' and 'rejectionReason' are populated
  }

  toggleCommentSidebar() {
    this.showCommentSidebar = !this.showCommentSidebar;
  }

 submitComment() {
  const content = this.newComment.trim();
  if (!content) return;

  const currentUser = this.auth.getUser();
  const issueId = this.issue?.id;
  const userId = currentUser?.id; // logged-in user's id
  const developerId = this.issue?.assignedTo?.id ?? null; // If developer is not assigned, make sure it can be null

  // Prepare the request body as a JSON object
  const body = {
    issueId: issueId,
    userId: userId,
    developerId: developerId, // Ensure this is not null if not required
    content: content
  };

  this.http.post<any>(
    'http://localhost:8085/api/comments/add',
    body,  // Send the body as JSON
    {
      headers: this.authHeader().set('Content-Type', 'application/json') // Set to application/json
    }
  ).subscribe({
    next: (res) => {
      console.log('[comments/add] success:', res);
      this.comments.unshift({
        author: res?.userDto?.username ?? currentUser?.username ?? 'You',
        message: res?.content ?? content
      });
      this.newComment = '';  // Clear the input after submission
    },
    error: (err) => {
      console.error('[comments/add] failed:', err);
    }
  });
}


  loadComments() {
    this.http.get<{ id: number; content: string; userDto: any; developerDto: any; createdAt: string }[]>(
      `http://localhost:8085/api/comments/issue/${this.issue.id}`,
      { headers: this.authHeader() } // Add headers for authentication
    ).subscribe({
      next: (res) => {
        this.comments = res.map((comment) => ({
          author: comment.userDto?.username ?? 'Unknown',
          message: comment.content,
        }));
      },
      error: (err) => {
        console.error('[comments/load] failed:', err);
      }
    });
  }

  onCloseModal() {
    this.close.emit();
  }
}
