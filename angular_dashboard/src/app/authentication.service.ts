import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class AuthenticationService {

  private readonly TOKEN_KEY = 'auth_token';
  private readonly USER_KEY = 'helpdeskUser';

  constructor() {}

  // Store JWT and user info
  public login(user: any): void {
    sessionStorage.setItem(this.USER_KEY, JSON.stringify(user));
    sessionStorage.setItem(this.TOKEN_KEY, user.token);
  }

  // Logout and clear session
  public logout(): void {
    sessionStorage.removeItem(this.USER_KEY);
    sessionStorage.removeItem(this.TOKEN_KEY);
  }

  // Get stored token
  public getToken(): string | null {
    return sessionStorage.getItem(this.TOKEN_KEY);
  }

  // Get stored user
  public getUser(): any {
    const user = sessionStorage.getItem(this.USER_KEY);
    return user ? JSON.parse(user) : null;
  }

  // Check if user is authenticated
  public isAuthenticated(): boolean {
    return this.getToken() !== null;
  }
}
