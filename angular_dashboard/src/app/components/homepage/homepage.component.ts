import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthenticationService } from '../../authentication.service';
import { CommonModule } from '@angular/common'; 

@Component({
  selector: 'app-homepage',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './homepage.component.html',
  styleUrls: ['./homepage.component.css']
})
export class HomepageComponent {
  user: any;

  constructor(private auth: AuthenticationService, private router: Router) {
    this.user = this.auth.getUser();
  }

  goToHelpDesk(): void {
    if (!this.user) return;

    console.log(this.user)
    const role = this.user.role;
    if (role === 'admin') this.router.navigate(['/admin']);
    else if (role === 'user') this.router.navigate(['/dashboard']);
    else if (role === 'developer') this.router.navigate(['/developer']);
    else this.router.navigate(['/home']); // fallback
  }
  logout(): void {
    this.auth.logout();             // clear token + user
    this.router.navigate(['/login']); // redirect to login page
  }
}
