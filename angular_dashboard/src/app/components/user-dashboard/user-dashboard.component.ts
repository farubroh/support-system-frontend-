import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { getStatusColor } from '../utils/get-status-color';
import { IssueViewModalUserComponent } from "../issue-view-modal-user/issue-view-modal-user.component";
import { trigger, transition, style, animate } from '@angular/animations';
import { CreateIssueComponent } from "../create-issue/create-issue.component";

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, IssueViewModalUserComponent, CreateIssueComponent],
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

  totalUsers: number = 0;
  totalIssues: number = 0;

  // NEW: controls desktop filter menu open/close state
  isFilterOpen: boolean = false;

  constructor(private http: HttpClient, private router: Router) {}

  statusTabs = [
    { key: 'PENDING', label: 'Pending', icon: 'fa-regular fa-hourglass-half' },
    { key: 'INPROGRESS', label: 'In Progress', icon: 'fa-solid fa-spinner' },
    { key: 'COMPLETED', label: 'Completed', icon: 'fa-solid fa-circle-check' },
    { key: 'REJECTED', label: 'Rejected', icon: 'fa-solid fa-circle-xmark' }
  ];

  ngOnInit() {
    this.checkScreenSize();
  window.addEventListener('resize', this.checkScreenSize.bind(this));
    this.startPlusMessageLoop();
    this.fetchTotalUsers();
    this.fetchTotalIssues();
    this.fetchAllIssuesForKPI();

    const storedUser = sessionStorage.getItem('helpdeskUser');
    if (storedUser) {
      this.user = JSON.parse(storedUser);
      this.fetchNoteData();
      if (this.currentView === 'ISSUES') {
        this.fetchIssues();
      } else {
        this.fetchAllIssuesForHome();
      }

      this.fetchTodayStats();

      // Start polling every 1 second
      setInterval(() => {
        this.fetchTotalIssues();
        this.fetchTodayStats();
        this.fetchNoteData();
      }, 1000);
    }
  }
  checkScreenSize() {
  this.isMobileView = window.innerWidth < 768;
}

  fetchIssues() {
    this.loading = true;
    const url = `http://localhost:8085/api/issues/user/${this.user.id}?status=${this.activeTab}`;
    this.http.get<any[]>(url).subscribe({
      next: (res) => {
        this.issues = res;
        // console.log("Issues fetched:", this.issues);
        
      },
      error: (err) => {
        console.error("Error fetching issues:", err);
        this.issues = [];
      },
      complete: () => {
        setTimeout(() => {
          this.loading = false;
        }, 1000);
      }
    });
  }

  // UPDATED: closes filter menu after tab click
  onTabClick(tabKey: string) {
    this.activeTab = tabKey;
    this.fetchIssues();

    // Close desktop filter menu after selection
    this.isFilterOpen = false;
  }

  // NEW: toggles desktop filter menu open/close
  toggleFilterMenu() {
    this.isFilterOpen = !this.isFilterOpen;
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
    if (cat.includes('quota problem')) return 'bi bi-shield-check text-success fs-4' ;
    if (cat.includes('upload')) return 'fa-solid fa-upload';
    if (cat.includes('profile')) return 'fa-solid fa-user-gear';
    if (cat.includes('result')) return 'fa-solid fa-chart-line';

    return 'fa-solid fa-circle-question';
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
      }, 100000);
    }, 100000);
  }

  currentView: string = 'HOME';

  fetchTotalUsers() {
    this.http.get<any>('http://localhost:8085/api/issues/users/total').subscribe({
      next: (data) => {
        this.totalUsers = data.count;
      },
      error: (err) => {
        console.error("Error fetching total users:", err);
      }
    });
  }

  fetchTotalIssues() {
    this.http.get<any>('http://localhost:8085/api/issues/issues/total').subscribe({
      next: (data) => {
        
        
        this.totalIssues = data.count;
      },
      error: (err) => {
        console.error("Error fetching total issues:", err);
      }
    });
  }
  
  totalPendingIssuesUser: number = 0;
  totalIssuesDate: string = ''; // For displaying the date when total issues are fetched
  latestIssueDate: string = ''; // For displaying the date of latest issue for the user

  fetchPendingIssuesForUser() {
  const url = `http://localhost:8085/api/issues/user/${this.user.id}?status=PENDING`; // URL to get pending issues for the logged-in user
  this.http.get<any[]>(url).subscribe({
    next: (res) => {
      // Set the total number of pending issues for the user
      // console.log("Pending issues for user:", res);
      this.totalPendingIssuesUser = res.length;

      // Check if there are any pending issues, then set the date of the latest one
      if (res.length > 0) {
        const latestIssue = res[0]; // Assuming the first issue in the list is the latest one
        this.latestIssueDate = new Date(latestIssue.createdDate).toLocaleDateString(); // Adjust according to your data structure
      } else {
        this.latestIssueDate = 'No Pending Issues';
      }
    },
    error: (err) => {
      console.error("Error fetching pending issues for user:", err);
    }
  });
}


  todayIssueCount: number = 0;
  userIssueRank: number = -1;
  userRankString: string = '';

  fetchTodayStats() {
    if (!this.user || !this.user.id) {
      return;
    }

    this.http.get<any>(`http://localhost:8085/api/issues/issues/today/user-rank/${this.user.id}`).subscribe({
      next: (res) => {
        this.todayIssueCount = res.totalTodayIssues;
        this.userIssueRank = res.userRank;

        if (this.userIssueRank > 0) {
          this.userRankString = this.getOrdinalSuffix(this.userIssueRank);
        } else {
          this.userRankString = '';
        }
      },
      error: (err) => {
        console.error("Failed to fetch today's issue stats", err);
      }
    });
  }

  fetchAllIssuesForHome() {
    this.loading = true;
    const statuses = ['PENDING', 'INPROGRESS', 'COMPLETED', 'REJECTED'];
    let combinedIssues: any[] = [];
    let completedCalls = 0;

    statuses.forEach(status => {
      const url = `http://localhost:8085/api/issues/user/${this.user.id}?status=${status}`;
      this.http.get<any[]>(url).subscribe({
        next: (res) => {
          // console.log(`Fetched ${status} issues:`, res);
          if(res)
          combinedIssues = combinedIssues.concat(res.map(issue => ({ ...issue, status })));
        },
        error: (err) => {
          console.error(`Error fetching ${status} issues`, err);
        },
        complete: () => {
          completedCalls++;
          if (completedCalls === statuses.length) {
            this.issues = combinedIssues;
            this.loading = false;
          }
        }
      });
    });
  }

  getOrdinalSuffix(n: number): string {
    const j = n % 10, k = n % 100;
    if (j === 1 && k !== 11) return `${n}st`;
    if (j === 2 && k !== 12) return `${n}nd`;
    if (j === 3 && k !== 13) return `${n}rd`;
    return `${n}th`;
  }
  isMobileView: boolean = false;

  totalPendingIssues: number = 0;
latestUserPendingIssueId: number | null = null;
currentDate: string = new Date().toDateString();


  fetchNoteData() {
  if (!this.user || !this.user.id || !this.allIssues.length) return;

  const pendingAll = this.allIssues.filter(
    issue => issue.status?.toUpperCase() === 'PENDING'
  );

  const userPending = pendingAll.filter(
    issue => issue.user?.id === this.user.id
  );

  this.totalPendingIssues = userPending.length;

  if (userPending.length > 0) {
    // 🔹 Find the user's pending issue with the highest ID
    const userLatest = userPending.reduce((max, curr) => curr.id > max.id ? curr : max);

    this.latestUserPendingIssueId = userLatest.id;

    // 🔹 Find its position in the global list (sorted by ID ascending)
    const sortedAll = pendingAll.sort((a, b) => a.id - b.id);
    const position = sortedAll.findIndex(i => i.id === userLatest.id) + 1;

    // Replace the displayed ID with its position in the global pending list
    this.latestUserPendingIssueId = position;
  } else {
    this.latestUserPendingIssueId = null;
  }
}



  getCategoryColor(category: string): string {
    switch ((category || '').toLowerCase()) {
      case 'edu mail problem':
        return '#f48fb1';
      case 'payment problem':
        return '#ffb74d';
      case 'quota problem':
        return '#81c784';
      case 'result problem':
        return '#64b5f6';
      case 'login issue':
        return '#9575cd';
      default:
        return '#cfd8dc';
    }
  }
  allIssues: any[] = [];
totalPendingIssuesAllUsers: number = 0;

createIssue() {
  this.showCreateModal = true; // Show modal instead of navigating
}


closeCreateModal() {
  this.showCreateModal = false;
}


fetchAllIssuesForKPI() {
  console.log('API call triggered');
  this.http.get<any[]>(`http://localhost:8085/api/issues/all_admin`).subscribe(
    (res) => {
      console.log('Raw response:', res);

      this.allIssues = Array.isArray(res) ? res : [];

      // Filter all issues with status 'PENDING' for all users
      const pendingIssues = this.allIssues.filter(
        issue => issue.status?.toUpperCase() === 'PENDING'
      );

      // Update the total pending issues for all users
      this.totalPendingIssuesAllUsers = pendingIssues.length;

      console.log('Total Pending Issues for All Users:', this.totalPendingIssuesAllUsers);
    },
    (err) => {
      console.error('Failed to fetch all issues:', err);
      this.allIssues = [];
    }
  );
}


}
