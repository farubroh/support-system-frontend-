import { Component, EventEmitter, Input, Output, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { FormsModule } from '@angular/forms';

type UiDeveloper = { id: number; username: string };
type Issue = {
  id: number;
  title: string;
  description: string;
  status: 'PENDING'|'INPROGRESS'|'COMPLETED'|'REJECTED';
  user: { id: number; username?: string };
  category?: string;
  developerId?: number;
  developerName?: string;
  files?: string[];
  deadline?: string;
  completedReason?: string;
  rejectionReason?: string;
};

@Component({
  selector: 'app-issue-view-modal-admin',
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule],
  templateUrl: './issue-view-modal-admin.component.html',
  styleUrls: ['./issue-view-modal-admin.component.css']
})
export class IssueViewModalAdminComponent implements OnInit {
  @Input() issue!: Issue;
  @Output() close = new EventEmitter<void>();
  @Output() refresh = new EventEmitter<void>();

  // configurable base API
  apiBase = 'http://localhost:8085';

  developers: UiDeveloper[] = [];
  selectedDeveloper: UiDeveloper | null = null;

  categoryList: string[] = [];
  newCategory = '';

  showAssignBox = false;
  showCategoryBox = false;
  showCommentSidebar = false;

  newComment = '';
  comments: { author: string; message: string }[] = [
    { author: 'Md. Younus Hossain Ahsan', message: 'Please check the mail address recovery issue with registrar.' },
    { author: 'Omar Faruk', message: 'Added this card to PENDING.' }
  ];

  searchQuery = '';

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.getDevelopers();
    this.getCategories();
  }

  private getDevelopers() {
    this.http.get<any[]>(`${this.apiBase}/api/developers`).subscribe({
      next: (res: any[]) => {
        this.developers = (res || []).map((d: any) => ({
          id: d?.id,
          username: d?.user?.username ?? d?.username ?? `Developer #${d?.id}`
        }));
      },
      error: () => alert('Failed to load developers')
    });
  }

  private getCategories() {
    this.http.get<any[]>(`${this.apiBase}/api/categories`).subscribe({
      next: (res: any[]) => {
        // CategoryDto[] -> { categoryId, categoryName }
        this.categoryList = (res || []).map(c => c?.categoryName).filter(Boolean);
      },
      error: () => alert('Failed to load categories')
    });
  }

  /* Toggles */
  toggleAssignBox() {
    this.showAssignBox = !this.showAssignBox;
    this.selectedDeveloper = null;
    this.searchQuery = '';

    // if opened and list empty, try (re-)fetch now
    if (this.showAssignBox && !this.developers.length) {
      this.getDevelopers();
    }
  }
  toggleCategoryBox() {
    this.showCategoryBox = !this.showCategoryBox;
    if (this.showCategoryBox) this.getCategories(); // ensure latest list
  }
  toggleCommentSidebar() { this.showCommentSidebar = !this.showCommentSidebar; }
  toggleAllOff() {
    this.showAssignBox = this.showCategoryBox = this.showCommentSidebar = false;
  }

  /* Developer selection */
  selectDeveloper(dev: UiDeveloper) { this.selectedDeveloper = dev; }

  filteredDevelopers(): UiDeveloper[] {
    const q = (this.searchQuery || '').toLowerCase().trim();
    if (!q) return this.developers;
    return this.developers.filter(dev => (dev.username || '').toLowerCase().includes(q));
  }

  submitAssignment() {
    if (!this.selectedDeveloper) return;
    const payload = { developerId: this.selectedDeveloper.id };

    this.http.post(`${this.apiBase}/api/issues/${this.issue.id}/assign`, payload).subscribe({
      next: (res: any) => {
        // use server response when possible; otherwise update local
        this.issue.status = 'INPROGRESS';
        this.issue.developerId = this.selectedDeveloper!.id;
        this.issue.developerName = res?.developerName ?? this.selectedDeveloper!.username;
        this.selectedDeveloper = null;
        this.showAssignBox = false;
        this.refresh.emit();
        this.close.emit();
      },
      error: () => alert('Failed to assign developer')
    });
  }

  getDeveloperName(devId?: number): string {
    if (!devId) return '';
    const dev = this.developers.find(d => d.id === devId);
    return dev ? dev.username : '';
  }

  /* Replace issue category by name (server upserts if needed) */
  setCategoryForIssue(categoryName: string) {
    const name = (categoryName || '').trim();
    if (!name) return;

    this.http.put(
      `${this.apiBase}/api/issues/${this.issue.id}/category/by-name`,
      { categoryName: name }
    ).subscribe({
      next: (updated: any) => {
        // Prefer server truth if it returns IssueDto with categories
        const fromServer = updated?.categoryDtoList?.[0]?.categoryName;
        this.issue.category = fromServer ?? name;
        this.showCategoryBox = false;
        this.refresh.emit();
      },
      error: () => alert('Failed to update category')
    });
  }

  /* Add new category AND assign it to the current issue */
  addCategory() {
    const name = this.newCategory.trim();
    if (!name) return;

    // 1) Create category in DB
    this.http.post(`${this.apiBase}/api/categories`, { categoryName: name }).subscribe({
      next: (res: any) => {
        const savedName = res?.categoryName?.trim() || name;
        if (!this.categoryList.includes(savedName)) this.categoryList.push(savedName);
        this.newCategory = '';

        // 2) Immediately set this category for the issue (DB + UI)
        this.setCategoryForIssue(savedName);
      },
      error: () => alert('Failed to add category')
    });
  }

  /* Mark complete (use backend payload shape) */
  markComplete() {
    const stored = localStorage.getItem('helpdeskUser');
    const parsed = stored ? JSON.parse(stored) : null;
    const workedBy = parsed?.user?.id ?? parsed?.id;

    const payload = {
      workedBy,
      fromStatus: this.issue.status,
      toStatus: 'COMPLETED',
      rejectionReason: null,
      completedAnalysis: 'Marked manually by admin'
    };

    this.http.post(`${this.apiBase}/api/issues/${this.issue.id}/status`, payload).subscribe({
      next: (serverIssue: any) => {
        // adopt server truth if provided
        this.issue.status = serverIssue?.status ?? 'COMPLETED';
        this.issue.completedReason = serverIssue?.completedReason ?? this.issue.completedReason;
        this.refresh.emit();
        this.close.emit();
      },
      error: () => alert('Failed to mark as completed.')
    });
  }

  /* Comments (local UI only) */
  submitComment() {
    const msg = (this.newComment || '').trim();
    if (!msg) return;
    this.comments.unshift({ author: 'Admin', message: msg });
    this.newComment = '';
  }

  onCloseModal() { this.close.emit(); }
}
