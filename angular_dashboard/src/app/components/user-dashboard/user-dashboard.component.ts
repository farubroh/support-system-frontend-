import { Component, OnInit } from '@angular/core';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { getStatusColor } from '../utils/get-status-color';
import { IssueViewModalUserComponent } from "../issue-view-modal-user/issue-view-modal-user.component";


@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, HttpClientModule, RouterModule, IssueViewModalUserComponent],
  templateUrl: './user-dashboard.component.html',
  styleUrls: ['./user-dashboard.component.css']
})
export class DashboardComponent implements OnInit {
  issues: any[] = [];
  activeTab: string = 'PENDING';
  loading: boolean = true;
  selectedIssue: any = null;
  //user = { id: 1, username: 'User', role: 'User' }; // Replace with actual session user

  
  user: any;


  statusTabs = [
    { key: 'PENDING', label: 'Pending' },
    { key: 'INPROGRESS', label: 'In Progress' },
    { key: 'COMPLETED', label: 'Completed' },
    { key: 'REJECTED', label: 'Rejected' }
  ];

  constructor(private http: HttpClient) {}

  ngOnInit() {
  const storedUser = sessionStorage.getItem('helpdeskUser');
  if (storedUser) {
    this.user = JSON.parse(storedUser);
    this.fetchIssues();  // Fetch issues for the logged-in user
  } else {
    console.error('No user found in sessionStorage');
    // Optional: redirect to login page if not logged in
    // this.router.navigate(['/login']);
  }
}

  // Fetch issues based on the status
  fetchIssues() {
  this.loading = true;
  const url = `http://localhost:8085/api/issues/user/${this.user.id}?status=${this.activeTab}`;
  this.http.get<any[]>(url).subscribe({
    next: (res) => {
      console.log("Received issues:", res); // You confirmed it's correct ✅
      this.issues = res;
    },
    error: (err) => {
      console.error("Fetch error:", err);
      this.issues = [];
    },
    complete: () => (this.loading = false)
  });
}


  onTabClick(status: string) {
    this.activeTab = status;
    this.fetchIssues();
  }

  getStatusColor = getStatusColor;

  // Handle the event when a new issue is created
  handleIssueCreated() {
    this.fetchIssues();  // Refresh the issue list after creating a new issue
  }
}
