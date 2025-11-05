import { Component } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthenticationService } from '../../authentication.service';

@Component({
  selector: 'app-login-page',
  imports: [CommonModule, FormsModule],
  templateUrl: './login-page.component.html',
  styleUrls: ['./login-page.component.css']
})
export class LoginPageComponent {
  credentials = { username: '', password: '' };
  error: string = '';

  constructor(
    private http: HttpClient,
    private router: Router,
    private authService: AuthenticationService
  ) { }

  handleSubmit(event: Event): void {
    event.preventDefault();
    this.error = '';

    // 🔒 OLD LOGIC (commented out, for reference)
    /*
    const payload = {
      userId: this.credentials.username,
      password: this.credentials.password
    };

    this.http.post<{ accessToken?: string; refreshToken?: string }>(
      'http://localhost:8085/api/auth/login',
      payload
    ).subscribe({
      next: (res) => {
        console.log(res);
        if (res && res.accessToken) {
          const userWithTokens: any = {
            token: res.accessToken,
            refreshToken: res.refreshToken ?? null,
          };
          this.authService.login(userWithTokens);
          this.router.navigate(['/home']);
        } else {
          this.error = '❌ Invalid credentials or no token received';
          console.error('Login response missing accessToken:', res);
        }
      },
      error: (err) => {
        console.error('Login error:', err);
        this.error = '❌ Invalid Username or Password';
      }
    });
    */

    // ✅ NEW LOGIC (for AUST IUMS)
    const url = 'https://iums.aust.edu/ums-webservice-academic/supportSystem/getUserInformation';
    const payload = {
      loginInfo: {
        pUserId: this.credentials.username,
        pPassword: this.credentials.password
      }
    };

    // ✅ Send POST request
    this.http.post(url, payload).subscribe({
      next: (response: any) => {
        console.log('IUMS Login Response:', response);

        // ✅ Check if response contains user info
        if (response && response.userId) {
          console.log('✅ Login successful, redirecting to home...');
          this.router.navigate(['/home']);
        } else {
          this.error = '❌ Invalid Username or Password';
        }
      },
      error: (err) => {
        console.error('IUMS Login Error:', err);
        this.error = '❌ Failed to connect or invalid credentials';
      }
    });
  }
}
