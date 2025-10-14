import { Component } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthenticationService } from '../../authentication.service';

@Component({
  selector: 'app-login-page',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login-page.component.html',
  styleUrls: ['./login-page.component.css']
})
export class LoginPageComponent {
  credentials = { username: '', password: '', isAdmin: false };
  error: string = '';

  constructor(
    private http: HttpClient,
    private router: Router,
    private authService: AuthenticationService
  ) { }

  handleSubmit(event: Event): void {
    // console.log(event);
    
    event.preventDefault();
    this.error = '';

    this.http.post<any>('http://localhost:8085/api/authenticate', this.credentials)
      .subscribe({
        next: (res: any) => {
          console.log(res);


          if (res && res.token) {
            localStorage.setItem('authToken', res.token);
            this.authService.login({ ...res.user, token: res.token });

            // Navigate to homepage first
            this.router.navigate(['/home']);
          } else {
            this.error = '❌ Invalid credentials or no token received';
          }

        },
        error: (err) => {
          console.error(err);
          this.error = '❌ Invalid Username or Password';
        }
      });
  }
}
