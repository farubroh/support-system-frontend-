import {
  Component,
  OnInit,
  CUSTOM_ELEMENTS_SCHEMA,
  ChangeDetectorRef
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { getStatusColor } from '../utils/get-status-color';
import { IssueViewModalAdminComponent } from '../issue-view-modal-admin/issue-view-modal-admin.component';
import { NgCircleProgressModule } from 'ng-circle-progress';
import { DomSanitizer } from '@angular/platform-browser';
import { SafeHtmlPipe } from '../safe-html.pipe';
import { forkJoin } from 'rxjs';

type CategoryDto = { categoryId: number; categoryName: string };

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
  // Data
  issues: any[] = [];           // current list for the active server status
  allIssuesCache: any[] = [];   // global cache across all statuses (for counts & ALL view)

  // UI state
  activeTab: string = 'PENDING'; // which server status we fetch: PENDING/INPROGRESS/COMPLETED/REJECTED/ALL
  loading: boolean = true;
  selectedIssue: any = null;
  isDarkMode = false;
  isDesktopView = true;

  // Status counts (sidebar) — you can compute from cache or fetch from server
  pendingCount: number = 0;
  inProgressCount: number = 0;
  completedCount: number = 0;
  rejectedCount: number = 0;

  // Filters
  filterStatus: string = ''; // client-side status filter (used for ALL view if desired)
  categoryList: string[] = []; // dynamic categories from API
  selectedCategory: string = '';
  searchQuery: string = '';
  searchConflictMessage: string = '';

  // Sidebar toggles
  showingAllIssues: boolean = true;
  showingCategories: boolean = true;
  showingGraph: boolean = false;
  showingDevelopers: boolean = false;

  // Unused but kept for compatibility with your template
  user = { username: 'Admin', role: 'Admin' };
  pendingPercent = 0;
  completedPercent = 0;
  rejectedPercent = 0;
  totalUsersIssued = 0;
  totalIssuesCount = 0;

  statusTabs = [
    { key: 'PENDING', label: 'Pending' },
    { key: 'INPROGRESS', label: 'In Progress' },
    { key: 'COMPLETED', label: 'Completed' },
    { key: 'REJECTED', label: 'Rejected' }
  ];

  constructor(
    private http: HttpClient,
    private sanitizer: DomSanitizer,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.fetchIssues();
    this.loadCategories();
    this.fetchAllIssuesCache();   // build global cache for counts & ALL view
    this.updateCountsFromCache(); // compute sidebar counts from cache (initially empty; will update after cache loads)

    this.filterStatus = ''; // no client-side status filter initially

    this.isDesktopView = window.innerWidth >= 768;
    window.addEventListener('resize', () => {
      this.isDesktopView = window.innerWidth >= 768;
    });

    // Periodic refresh (optional)
    setInterval(() => {
      this.fetchIssues();
      this.loadCategories();
      this.fetchAllIssuesCache();
    }, 10000);
  }

  get searchActive(): boolean {
    return this.searchQuery.trim().length > 0;
  }

  /** Load issues by current server-side tab (activeTab) */
  fetchIssues() {
    this.loading = true;

    // If "ALL", we rely on the global cache and skip a request here.
    if (this.activeTab === 'ALL') {
      this.loading = false;
      return;
    }

    // Single-status fetch
    this.http
      .get<any[]>(`http://localhost:8085/api/issues/status/${this.activeTab}`)
      .subscribe({
        next: (res) => {
          this.issues = res || [];
          this.loading = false;
        },
        error: (err) => {
          console.error(err);
          this.issues = [];
          this.loading = false;
        }
      });
  }

  /** Load all statuses once into cache for global counts & ALL view */
  fetchAllIssuesCache() {
    const base = 'http://localhost:8085/api/issues/status';
    forkJoin([
      this.http.get<any[]>(`${base}/PENDING`),
      this.http.get<any[]>(`${base}/INPROGRESS`),
      this.http.get<any[]>(`${base}/COMPLETED`),
      this.http.get<any[]>(`${base}/REJECTED`)
    ]).subscribe({
      next: (lists) => {
        this.allIssuesCache = (lists || []).flat().filter(Boolean);
        this.updateCountsFromCache(); // keep sidebar numbers in sync
      },
      error: (err) => console.error('Failed to load all issues cache', err)
    });
  }

  /** Compute sidebar counts from the global cache (no extra requests) */
  updateCountsFromCache() {
    const norm = (s: string) => (s || '').trim().toUpperCase();
    const list = this.allIssuesCache;
    this.pendingCount    = list.filter(i => norm(i.status) === 'PENDING').length;
    this.inProgressCount = list.filter(i => norm(i.status) === 'INPROGRESS').length;
    this.completedCount  = list.filter(i => norm(i.status) === 'COMPLETED').length;
    this.rejectedCount   = list.filter(i => norm(i.status) === 'REJECTED').length;
  }

  /** Load categories from backend (public GET in your SecurityConfig) */
  loadCategories() {
    this.http.get<CategoryDto[]>(`http://localhost:8085/api/categories`)
      .subscribe({
        next: (list) => {
          this.categoryList = (list || []).map(c => c.categoryName);
        },
        error: (err) => {
          console.error('Failed to load categories', err);
        }
      });
  }

  /** Add new category via prompt() then POST and refresh list */
  onAddCategory(ev: MouseEvent) {
    ev.stopPropagation(); // don’t toggle the list
    const name = (prompt('Enter new category name:') || '').trim();
    if (!name) return;

    const body: CategoryDto = { categoryId: 0, categoryName: name };
    this.http.post<CategoryDto>(`http://localhost:8085/api/categories`, body)
      .subscribe({
        next: (created) => {
          if (created?.categoryName && !this.categoryList.includes(created.categoryName)) {
            this.categoryList = [...this.categoryList, created.categoryName];
          }
          // Optionally re-cache issues if new category impacts views/counts later
        },
        error: () => alert('Failed to create category')
      });
  }

  /** For the sidebar header row only */
  toggleCategories(_ev: MouseEvent) {
    this.showingCategories = !this.showingCategories;
  }

  /** Table source + filtering pipeline */
  get filteredIssues(): any[] {
    // Base list depends on activeTab
    const baseList = this.activeTab === 'ALL' ? this.allIssuesCache : this.issues;
    const normalize = (status: string) => (status || '').trim().toUpperCase();
    let results = [...baseList];

    // Search filter
    if (this.searchActive) {
      const q = this.searchQuery.toLowerCase();
      results = results.filter(issue =>
        (issue.title && issue.title.toLowerCase().includes(q)) ||
        (issue.category && issue.category.toLowerCase().includes(q)) ||
        (issue.status && (issue.status + '').toLowerCase().includes(q))
      );
    }

    // Category filter
    if (this.selectedCategory) {
      results = results.filter(i => i.category === this.selectedCategory);
    }

    // Optional: client-side status filter (useful only for ALL view)
    if (this.activeTab === 'ALL' && this.filterStatus) {
      results = results.filter(i => normalize(i.status) === this.filterStatus);
    }

    return results;
  }

  /** Count issues per category — based on global cache for always-correct numbers */
  getCategoryCount(category: string): number {
    const norm = (s: string) => (s || '').trim().toLowerCase();
    const target = norm(category);
    return this.allIssuesCache.filter(i => norm(i.category) === target).length;
  }

  /** Left “Problem Status” clicks — load that status from the server */
  setFilterStatus(status: string) {
  // optional: clear search so results aren't hidden
  this.searchQuery = '';
  this.searchConflictMessage = '';

  this.selectedCategory = '';   // don’t mix status + category
  this.filterStatus = status;   // <-- keep for HIGHLIGHT
  this.activeTab = status;      // fetch from server for this status
  this.fetchIssues();
}
  selectCategory(category: string) {
    if (this.searchActive) {
      this.searchConflictMessage = 'Clear search to view category results.';
    } else {
      this.searchConflictMessage = '';
      this.selectedCategory = category;

      // If you're on a specific status and the issue in this category is in a different status,
      // you might want ALL to ensure visibility:
      // this.activeTab = 'ALL';
      // this.fetchIssues(); // not needed for ALL since we rely on cache
    }
  }

  clearSearch() {
    this.searchQuery = '';
    this.searchConflictMessage = '';
  }

  /** Top tabs → switch server status and fetch (if you enable tabs in HTML) */
  onTabClick(status: string) {
  this.activeTab = status;
  this.filterStatus = status === 'ALL' ? '' : status; // highlight current tab (or none on ALL)
  this.fetchIssues();
}

  /** Assign developer (modal action) */
  assignDeveloper(developerId: number) {
    this.http.post(`http://localhost:8085/api/issues/${this.selectedIssue.id}/assign`, {
      developerId: developerId
    })
    .subscribe({
      next: (res: any) => {
        // Server returns { developerName, currentlyTotalTaskInHand }
        this.selectedIssue.developerName = res?.developerName || this.selectedIssue?.developerName;
        this.cdr.detectChanges();

        // Refresh current list and global cache so counts/rows are correct
        this.refreshIssueList();
        this.fetchAllIssuesCache();

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
      case 'edu mail problem': return '#7321D7';
      case 'payment problem': return '#B10F99';
      case 'quota problem': return '#0E9591';
      case 'result problem': return '#2E0D3C';
      case 'login issue': return '#9575cd';
      default: return '#cfd8dc';
    }
  }

  toggleDarkMode() {
    this.isDarkMode = !this.isDarkMode;
  }

  // Sidebar toggles (unchanged)
  showCategories() { this.showingCategories = !this.showingCategories; }
  showAllIssues() { this.showingAllIssues = !this.showingAllIssues; }
  showGraph() { this.showingGraph = !this.showingGraph; }
  showDevelopers() { this.showingDevelopers = !this.showingDevelopers; }
}
