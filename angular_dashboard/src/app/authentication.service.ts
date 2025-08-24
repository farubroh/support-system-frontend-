import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
@Injectable({
  providedIn: 'root'
})
export class AuthenticationService {
  private readonly TOKEN_KEY = 'auth_token';
  private readonly USER_KEY = 'helpdeskUser';

  constructor() {}

  // Store JWT and user info
  public login(user: any): void {
    localStorage.setItem(this.USER_KEY, JSON.stringify(user));  // Store user info
    localStorage.setItem(this.TOKEN_KEY, user.token);   
            // Store JWT token
  }

  // Logout and clear session
  public logout(): void {
    localStorage.removeItem(this.USER_KEY);  // Remove user info
    localStorage.removeItem(this.TOKEN_KEY); // Remove JWT token
  }

  // Get stored token
  public getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);  // Retrieve token from localStorage
  }

  // Get stored user
  public getUser(): any {
    const user = localStorage.getItem(this.USER_KEY);  // Retrieve user info from localStorage
    return user ? JSON.parse(user) : null;
  }

  // Check if user is authenticated
  public isAuthenticated(): boolean {
    return this.getToken() !== null;  // Check if token exists in localStorage
  }
}
