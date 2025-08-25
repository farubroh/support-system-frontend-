import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class AuthenticationService {
  private readonly TOKEN_KEY = 'auth_token';
  private readonly USER_KEY = 'helpdeskUser';

  login(user: any): void {
    localStorage.setItem(this.USER_KEY, JSON.stringify(user));
    localStorage.setItem(this.TOKEN_KEY, user.token);
  }

  logout(): void {
    localStorage.removeItem(this.USER_KEY);
    localStorage.removeItem(this.TOKEN_KEY);
  }

  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  getUser(): any | null {
    const raw = localStorage.getItem(this.USER_KEY);
    return raw ? JSON.parse(raw) : null;
  }

  isAuthenticated(): boolean {
    return !!this.getToken();
  }
}
