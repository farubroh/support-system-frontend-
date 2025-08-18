import { Component } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthenticationService } from '../../authentication.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {
  credentials = { username: '', password: '', isAdmin: false };
  error: string = '';

  constructor(
    private http: HttpClient,
    private router: Router,
    private authService: AuthenticationService
  ) {}

  handleSubmit(event: Event): void {
    event.preventDefault();
    this.error = '';  // Reset error message

    this.http.post<any>('http://localhost:8085/api/authenticate', this.credentials)
      .subscribe({
        next: (res: any) => {
          console.log(res);
          // Store user and token upon successful login
          this.authService.login({ ...res.user, token: res.token });

          const role = res.user.role;
          if (role === 'Admin') {
            this.router.navigate(['/admin']);
          } else if (role === 'Student') {
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
