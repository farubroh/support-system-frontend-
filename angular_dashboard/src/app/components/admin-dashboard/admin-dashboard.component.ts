import { AfterViewInit, Component, OnInit, CUSTOM_ELEMENTS_SCHEMA, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClientModule, HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { getStatusColor } from '../utils/get-status-color';
import { IssueViewModalAdminComponent } from "../issue-view-modal-admin/issue-view-modal-admin.component";
import { NgCircleProgressModule } from 'ng-circle-progress';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { SafeHtmlPipe } from "../safe-html.pipe";

declare var CircularProgressBar: any;

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  templateUrl: './admin-dashboard.component.html',
  styleUrls: ['./admin-dashboard.component.css'],
  imports: [
    IssueViewModalAdminComponent,
    CommonModule,
    
    NgCircleProgressModule,
    SafeHtmlPipe,
    FormsModule
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  
})
export class AdminDashboardComponent implements OnInit {
  issues: any[] = [];
  allIssues: any[] = [];
  activeTab: string = 'PENDING';
  loading: boolean = true;
  selectedIssue: any = null;
  user = { username: 'Admin', role: 'Admin' };

  pendingPercent = 0;
  completedPercent = 0;
  rejectedPercent = 0;
  totalUsersIssued = 0;
  totalIssuesCount = 0;

  pendingCount: number = 0;
  inProgressCount: number = 0;
  completedCount: number = 0;
  rejectedCount: number = 0;

  isDarkMode = false;
  filterStatus: string = 'PENDING';

  calendarHtml: SafeHtml = '';
  currentMonthName = '';
  currentYear = 0;

  pieConfig: any = {};
  sidebarView: string = '';

  categoryCounts: any[] = [];
  categoryList = ['Edu mail problem', 'Payment problem', 'Result problem', 'Quota problem'];
  selectedCategory: string = '';

  statusTabs = [
    { key: 'PENDING', label: 'Pending' },
    { key: 'INPROGRESS', label: 'In Progress' },
    { key: 'COMPLETED', label: 'Completed' },
    { key: 'REJECTED', label: 'Rejected' }
  ];

  searchQuery: string = '';
  searchConflictMessage: string = '';

  constructor(private http: HttpClient, private sanitizer: DomSanitizer, private cdr: ChangeDetectorRef) {}
  isDesktopView = true;

 ngOnInit() {
  this.fetchIssues();

  // Ensure filterStatus is empty initially, no status selected
  this.filterStatus = '';

  this.isDesktopView = window.innerWidth >= 768;
  window.addEventListener('resize', () => {
    this.isDesktopView = window.innerWidth >= 768;
  });

  setInterval(() => {
    this.fetchIssues();
  }, 10000);
}


  get searchActive(): boolean {
    return this.searchQuery.trim().length > 0;
  }

  fetchIssues() {
    this.loading = true;
    const token = localStorage.getItem('auth_token');

    if (!token) {
      console.error('JWT token is missing');
      this.loading = false;
      return;
    }

    const headers = { Authorization: `Bearer ${token}` };

    this.http.get<any[]>(`http://localhost:8085/api/issues/status/${this.activeTab}`, { headers })
      .subscribe(
        (res) => {
          this.issues = res;
          this.updateStatusCounts();
          this.loading = false;
        },
        (err) => {
          console.error(err);
          this.issues = [];
          this.loading = false;
        }
      );
  }

 get filteredIssues(): any[] {
  const normalize = (status: string) => (status || '').trim().toUpperCase();
  let results = this.issues; // Start with all issues

  // Search across all issues first
  if (this.searchActive) {
    const query = this.searchQuery.toLowerCase();
    results = results.filter(issue =>
      (issue.title && issue.title.toLowerCase().includes(query)) ||
      (issue.category && issue.category.toLowerCase().includes(query)) ||
      (issue.status && issue.status.toLowerCase().includes(query))
    );
  }

  // Now apply category filter (if selected)
  if (this.selectedCategory) {
    results = results.filter(issue => issue.category === this.selectedCategory);
  }

  // Apply status filter if selected
  if (this.filterStatus && this.filterStatus !== 'ALL') {
    results = results.filter(issue => normalize(issue.status) === this.filterStatus);
  }

  return results;
}


 setFilterStatus(status: string) {
  if (this.searchActive) {
    this.searchConflictMessage = 'Clear search to view status results.';
  } else {
    this.searchConflictMessage = '';
    this.filterStatus = status;
    this.selectedCategory = '';  // Clear category selection when status is selected
  }
}


  selectCategory(category: string) {
  if (this.searchActive) {
    this.searchConflictMessage = 'Clear search to view category results.';
  } else {
    this.searchConflictMessage = '';
    this.selectedCategory = category;
    this.filterStatus = '';  // Clear status selection when category is selected
  }
}

  clearSearch() {
    this.searchQuery = '';
    this.searchConflictMessage = '';
  }

  onTabClick(status: string) {
    this.filterStatus = status;
    this.fetchIssues();
  }

  assignDeveloper(developerId: number) {
    this.http.post(`http://localhost:8085/api/issues/${this.selectedIssue.id}/assign`, {
      developerId: developerId
    })
    .subscribe({
      next: (res: any) => {
        this.selectedIssue.status = 'PENDING';
        this.selectedIssue.assignedDeveloper = developerId;
        this.selectedIssue.developerName = res.developerName;
        this.cdr.detectChanges();
        this.refreshIssueList();
        this.selectedIssue = null;
      },
      error: () => alert('Failed to assign developer')
    });
  }

  refreshIssueList() {
    this.fetchIssues();
  }

  getStatusColor = getStatusColor;

  getCategoryColor(category: string): string {
    switch ((category || '').toLowerCase()) {
      case 'edu mail problem': return ' #7321D7';
      case 'payment problem': return '  #B10F99';
      case 'quota problem': return '#0E9591';
      case 'result problem': return '#2E0D3C';
      case 'login issue': return '#9575cd';
      default: return '#cfd8dc';
    }
  }

  toggleDarkMode() {
    this.isDarkMode = !this.isDarkMode;
  }

  updateStatusCounts() {
    const normalize = (status: string) => (status || '').trim().toUpperCase();
    this.pendingCount = this.issues.filter(i => normalize(i.status) === 'PENDING').length;
    this.inProgressCount = this.issues.filter(i => normalize(i.status) === 'INPROGRESS').length;
    this.completedCount = this.issues.filter(i => normalize(i.status) === 'COMPLETED').length;
    this.rejectedCount = this.issues.filter(i => normalize(i.status) === 'REJECTED').length;
  }

  // === IMPORTANT FIX #2: count over this.issues, not this.allIssues ===
  getCategoryCount(category: string): number {
    return this.issues.filter(issue => issue.category === category).length; // <-- FIXED
  }

  showingAllIssues: boolean = true;
  showingCategories: boolean = true;
  showingGraph: boolean = false;
  showingDevelopers: boolean = false;

  showCategories() { this.showingCategories = !this.showingCategories; }
  showAllIssues() { this.showingAllIssues = !this.showingAllIssues; }
  showGraph() { this.showingGraph = !this.showingGraph; }
  showDevelopers() { this.showingDevelopers = !this.showingDevelopers; }
}
