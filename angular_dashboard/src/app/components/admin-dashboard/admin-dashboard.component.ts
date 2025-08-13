import { AfterViewInit, Component, OnInit, CUSTOM_ELEMENTS_SCHEMA, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClientModule, HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms'; // For ngModel
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
    HttpClientModule,
    NgCircleProgressModule,
    SafeHtmlPipe,
    FormsModule
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  providers: [HttpClient]
})
export class AdminDashboardComponent implements OnInit {
  issues: any[] = [];
  allIssues: any[] = [];
  activeTab: string = 'PENDING';
  loading: boolean = true;
  selectedIssue: any = null;
  user = {
    username: 'Admin',
    role: 'Admin'
  };

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

  constructor(private http: HttpClient, private sanitizer: DomSanitizer,private cdr: ChangeDetectorRef) {}
  isDesktopView = true;

  ngOnInit() {
    this.fetchIssues();
    this.fetchAllIssuesForKPI();

    this.isDesktopView = window.innerWidth >= 768;
    window.addEventListener('resize', () => {
      this.isDesktopView = window.innerWidth >= 768;
    });

    setInterval(() => {
      this.fetchIssues();
      this.fetchAllIssuesForKPI();
    }, 10000);
  }

  get searchActive(): boolean {
    return this.searchQuery.trim().length > 0;
  }

  fetchIssues() {
    this.loading = true;
    this.http.get<any[]>(`http://localhost:8085/api/issues/status/${this.activeTab}`).subscribe(
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

  fetchAllIssuesForKPI() {
    this.http.get<any[]>(`http://localhost:8085/api/issues/all_admin`).subscribe(
      (res) => {
        this.allIssues = res;
        this.calculateKPIFromAll();
      },
      (err) => {
        console.error('Failed to fetch all issues:', err);
        this.allIssues = [];
      }
    );
  }

  calculateKPIFromAll() {
    const total = this.allIssues.length || 1;
    this.totalIssuesCount = total;

    const normalize = (status: string) => (status || '').trim().toUpperCase();

    const pending = this.allIssues.filter(i => normalize(i.status) === 'PENDING').length;
    const completed = this.allIssues.filter(i => normalize(i.status) === 'COMPLETED').length;
    const rejected = this.allIssues.filter(i => normalize(i.status) === 'REJECTED').length;
    const inprogress = this.allIssues.filter(i => normalize(i.status) === 'INPROGRESS').length;

    this.pendingCount = pending;
    this.completedCount = completed;
    this.rejectedCount = rejected;
    this.inProgressCount = inprogress;

    this.pendingPercent = Math.round((pending / total) * 100);
    this.completedPercent = Math.round((completed / total) * 100);
    this.rejectedPercent = Math.round((rejected / total) * 100);

    const userSet = new Set<number>();
    for (let issue of this.allIssues) {
      if (issue.user?.id) userSet.add(issue.user.id);
    }
    this.totalUsersIssued = userSet.size;

    this.pieConfig = {
      percent: this.completedPercent,
      colorSlice: "#42a5f5",
      colorCircle: "#f1f1f1",
      fill: "#e3f2fd",
      stroke: 10,
      strokeBottom: 14,
      fontSize: "1.3rem",
      round: true,
      animationSmooth: "1s ease-out"
    };
  }

  get filteredIssues(): any[] {
    const normalize = (status: string) => (status || '').trim().toUpperCase();
    let results = this.allIssues;

    // Search first
    if (this.searchActive) {
      const query = this.searchQuery.toLowerCase();
      results = results.filter(issue =>
        (issue.title && issue.title.toLowerCase().includes(query)) ||
        (issue.category && issue.category.toLowerCase().includes(query)) ||
        (issue.status && issue.status.toLowerCase().includes(query))
      );
      return results; // Ignore category/status when searching
    }

    // If category selected, ignore status
    if (this.selectedCategory) {
      results = results.filter(issue => issue.category === this.selectedCategory);
      return results;
    }

    // If status selected
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
      this.selectedCategory = '';
    }
  }

  selectCategory(category: string) {
    if (this.searchActive) {
      this.searchConflictMessage = 'Clear search to view category results.';
    } else {
      this.searchConflictMessage = '';
      this.selectedCategory = category;
    }
  }

  clearSearch() {
    this.searchQuery = '';
    this.searchConflictMessage = '';
  }

  onTabClick(status: string) {
    this.filterStatus = status;
    this.fetchIssues();
    this.fetchAllIssuesForKPI();
  }

 assignDeveloper(developerId: number) {
  this.http.post(`http://localhost:8085/api/issues/${this.selectedIssue.id}/assign`, {
    developerId: developerId
  })
  .subscribe({
    next: (res: any) => {
      this.selectedIssue.status = 'PENDING';  // Do not change status to INPROGRESS
      this.selectedIssue.assignedDeveloper = developerId;
      this.selectedIssue.developerName = res.developerName;  // Update developer name

      // Manually trigger change detection to update the view
      this.cdr.detectChanges();
      this.refreshIssueList();  // Refresh the issue list to update the UI

      // Optionally close the issue view
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

  getCategoryCount(category: string): number {
    return this.allIssues.filter(issue => issue.category === category).length;
  }

  showingAllIssues: boolean = true;
  showingCategories: boolean = true;
  showingGraph: boolean = false;
  showingDevelopers: boolean = false;

  showCategories() {
    this.showingCategories = !this.showingCategories;
  }

  showAllIssues() {
    this.showingAllIssues = !this.showingAllIssues;
  }

  showGraph() {
    this.showingGraph = !this.showingGraph;
  }

  showDevelopers() {
    this.showingDevelopers = !this.showingDevelopers;
  }
}
