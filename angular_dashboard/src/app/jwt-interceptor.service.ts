// jwt-interceptor.service.ts (note the filename spelling)
import { Injectable } from '@angular/core';
import { HttpEvent, HttpHandler, HttpInterceptor, HttpRequest, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { AuthenticationService } from './authentication.service';
import { catchError } from 'rxjs/operators';
import { Router } from '@angular/router';

@Injectable()
export class JwtInterceptor implements HttpInterceptor {
  constructor(private auth: AuthenticationService, private router: Router) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    const token = this.auth.getToken();
    const looksLikeJwt = !!token && token !== 'null' && token !== 'undefined' && token.split('.').length === 3;

    let cloned = req;
    
    if (looksLikeJwt) {
      cloned = req.clone({ setHeaders: { Authorization: `Bearer ${token}` } });
      console.log('[JwtInterceptor] attached token to:', req.url);
    } else {
      console.log('[JwtInterceptor] skipping token for:', req.url, 'token=', token);
    }

    return next.handle(cloned).pipe(
      catchError((err: HttpErrorResponse) => {
        if (err.status === 401) {
          this.auth.logout();
          this.router.navigate(['/login']);
        }
        return throwError(() => err);
      })
    );
  }
}
