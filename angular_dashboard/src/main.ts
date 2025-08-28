import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app.component';
import { appConfig } from './app/app.config'; // ✅ Import the config


import { provideRouter } from '@angular/router';
import { routes } from './app/app.routes'; // or './app.routing.lts' if that's your file


import {
  provideHttpClient,
  withInterceptorsFromDi,
  HTTP_INTERCEPTORS
} from '@angular/common/http';
import { JwtInterceptor } from './app/jwt-interceptor.service';

bootstrapApplication(AppComponent, {
  providers: [
    provideRouter(routes),
    // 👇 this line enables DI-based interceptors
    provideHttpClient(withInterceptorsFromDi()),
    // 👇 register your interceptor
    { provide: HTTP_INTERCEPTORS, useClass: JwtInterceptor, multi: true }
  ]
}).catch(err => console.error(err));

