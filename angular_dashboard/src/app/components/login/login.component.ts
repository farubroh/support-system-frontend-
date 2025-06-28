import { Component } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {
  credentials = { username: '', password: '' };
  error: string = '';

  constructor(private http: HttpClient, private router: Router) {}

  handleSubmit(event: Event) {
    event.preventDefault();
    this.error = '';  // Reset error message
    this.http.post('http://localhost:8085/api/login', this.credentials)
      .subscribe({
        next: (res: any) => {
          // Store user info in sessionStorage
          sessionStorage.setItem('helpdeskUser', JSON.stringify(res));

          // Redirect user based on role
          const role = res.role;
          if (role === 'Admin') {
            this.router.navigate(['/admin']);
          } else if (role === 'User') {
            this.router.navigate(['/dashboard']);
          } else if (role === 'Developer') {
            this.router.navigate(['/developer']);
          }
        },
        error: (err) => {
          console.error(err);
          this.error = '❌ Invalid Username or Password';
        }
      });
  }
}
