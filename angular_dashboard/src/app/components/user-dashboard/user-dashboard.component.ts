import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { getStatusColor } from '../utils/get-status-color';
import { IssueViewModalUserComponent } from "../issue-view-modal-user/issue-view-modal-user.component";
import { trigger, transition, style, animate } from '@angular/animations';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, IssueViewModalUserComponent],
  templateUrl: './user-dashboard.component.html',
  styleUrls: ['./user-dashboard.component.css'],
  animations: [
    trigger('fadeInOut', [
      transition(':enter', [
        style({ opacity: 0 }),
        animate('300ms ease-in', style({ opacity: 1 }))
      ]),
      transition(':leave', [
        animate('200ms ease-out', style({ opacity: 0 }))
      ])
    ])
  ]
})
export class DashboardComponent implements OnInit {
  user: any;
  issues: any[] = [];
  selectedIssue: any = null;
  loading: boolean = true;
  activeTab: string = 'PENDING';
  showPlusMessage = true;
  showCreateModal: boolean = false;

  constructor(private http: HttpClient, private router: Router) {}

  statusTabs = [
    { key: 'PENDING', label: 'Pending', icon: 'fa-regular fa-hourglass-half' },
    { key: 'INPROGRESS', label: 'In Progress', icon: 'fa-solid fa-spinner' },
    { key: 'COMPLETED', label: 'Completed', icon: 'fa-solid fa-circle-check' },
    { key: 'REJECTED', label: 'Rejected', icon: 'fa-solid fa-circle-xmark' }
  ];

  ngOnInit() {
    this.startPlusMessageLoop();
    const storedUser = sessionStorage.getItem('helpdeskUser');
    if (storedUser) {
      this.user = JSON.parse(storedUser);
      this.fetchIssues();
    }
  }

  fetchIssues() {
    this.loading = true;
    const url = `http://localhost:8085/api/issues/user/${this.user.id}?status=${this.activeTab}`;

    this.http.get<any[]>(url).subscribe({
      next: (res) => {
        this.issues = res;
      },
      error: (err) => {
        console.error("Error fetching issues:", err);
        this.issues = [];
      },
      complete: () => {
        setTimeout(() => {
          this.loading = false;
        }, 1000); // Optional delay for smooth transition
      }
    });
  }

  onTabClick(tabKey: string) {
    this.activeTab = tabKey;
    this.fetchIssues();
  }

  getStatusColor = getStatusColor;

  getStatusClass(status: string): string {
    const s = status?.toLowerCase();
    if (s === 'completed') return 'success';
    if (s === 'pending') return 'pending';
    if (s === 'rejected') return 'rejected';
    return 'inprogress';
  }

  handleView(issue: any) {
    this.selectedIssue = issue;
  }

  handleClose() {
    this.selectedIssue = null;
  }

  getCategoryIcon(category: string | null | undefined): string {
    if (!category) return 'fa-solid fa-circle-question';

    const cat = category.toLowerCase();

    if (cat.includes('edu mail problem')) return 'fa-solid fa-envelope-circle-check';
    if (cat.includes('payment problem')) return 'fa-solid fa-bangladeshi-taka-sign';
    if (cat.includes('result problem')) return 'fa-solid fa-graduation-cap';
    if (cat.includes('quota problem')) return 'fa-solid fa-certificate';
    if (cat.includes('upload')) return 'fa-solid fa-upload';
    if (cat.includes('profile')) return 'fa-solid fa-user-gear';
    if (cat.includes('result')) return 'fa-solid fa-chart-line';

    return 'fa-solid fa-circle-question'; // fallback icon
  }

  toggleCreateModal() {
    this.showCreateModal = !this.showCreateModal;
  }

  navigateToCreateIssue(): void {
    this.router.navigate(['/create-issue']);
  }

  startPlusMessageLoop(): void {
    setInterval(() => {
      this.showPlusMessage = true;
      setTimeout(() => {
        this.showPlusMessage = false;
      }, 3000); // Show message for 3s
    }, 10000); // Show every 10s
  }
}
