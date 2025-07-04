import { Component, EventEmitter, Output } from '@angular/core';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-issue-form',
  standalone: true,
  imports: [CommonModule, HttpClientModule, FormsModule],
  templateUrl: './create-issue.component.html',
  styleUrls: ['./create-issue.component.css']
})
export class CreateIssueComponent {
  @Output() issueCreated = new EventEmitter<void>(); // Event emitter to notify the parent component

user: any;

constructor(private http: HttpClient, private router: Router) {
  const storedUser = sessionStorage.getItem('helpdeskUser');
  if (storedUser) {
    this.user = JSON.parse(storedUser);
  } else {
    console.error('No logged-in user found in sessionStorage');
    // Optional: redirect to login
    this.router.navigate(['/login']);
  }
}


  form = {
    title: '',
    description: ''
  };

  

  handleSubmit() {
    const requestBody = {
      title: this.form.title,
      description: this.form.description,
      userId: this.user.id
    };

    const headers = { 'Content-Type': 'application/json' };

    // Send the data as JSON (not FormData)
    this.http.post('http://localhost:8085/api/issues', requestBody, { headers }).subscribe({
      next: () => {
        // Emit the event after the issue is successfully created
        this.issueCreated.emit();

        // Clear the form and navigate back to the dashboard
        this.form.title = '';
        this.form.description = '';
        this.router.navigate(['/dashboard']);
      },
      error: err => {
        console.error('Error submitting issue:', err);
        alert('❌ Could not submit issue. Please try again later.');
      }
    });
  }
}
