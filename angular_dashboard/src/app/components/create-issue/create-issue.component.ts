import { Component } from '@angular/core';
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
  user = { id: 1, username: 'User', role: 'User' }; // Replace with actual session user

  form = {
    title: '',
    description: '',
    file: null as File | null
  };

  constructor(private http: HttpClient, private router: Router) {}

  onFileSelected(event: any) {
    this.form.file = event.target.files[0];
  }

  handleSubmit() {
    const formData = new FormData();
    formData.append('title', this.form.title);
    formData.append('description', this.form.description);
    formData.append('userId', this.user.id.toString());
    if (this.form.file) {
      formData.append('file', this.form.file);
    }

    this.http.post('http://localhost:8085/api/issues', formData).subscribe({
      next: () => {
        this.form.title = '';
        this.form.description = '';
        this.form.file = null;
        this.router.navigate(['/dashboard']);
      },
      error: err => {
        console.error('Error submitting issue:', err);
        alert('❌ Could not submit issue.');
      }
    });
  }
}
