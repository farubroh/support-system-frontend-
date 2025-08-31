import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';

type UiDeveloper = { id: number; username: string };

@Component({
  selector: 'app-issue-view-modal-admin',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './issue-view-modal-admin.component.html',
  styleUrls: ['./issue-view-modal-admin.component.css']
})
export class IssueViewModalAdminComponent {
  @Input() issue: any;
  @Output() close = new EventEmitter<void>();
  @Output() refresh = new EventEmitter<void>();

  developers: UiDeveloper[] = [];
  assignedDeveloper: UiDeveloper | null = null;
  selectedDeveloper: UiDeveloper | null = null;
  categoryList: string[] = []; // List of categories

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
    // Fetch developers
    this.http.get<any[]>('http://localhost:8085/api/developers').subscribe({
      next: (res: any[]) => {
        this.developers = (res || []).map((d: any) => ({
          id: d?.id,
          username: d?.user?.username ?? d?.username ?? `Developer #${d?.id}`
        }));
      },
      error: () => alert('Failed to load developers')
    });

   this.http.get<any[]>('http://localhost:8085/api/categories').subscribe({
    next: (res: any[]) => {
      console.log(res);  // Log the response to inspect the data
      // Store only category names in categoryList
      this.categoryList = res.map(category => category.categoryName);  // Extract categoryName from each object
    },
    error: () => alert('Failed to load categories')
  });
  }

  toggleAssignBox() {
    this.showAssignBox = !this.showAssignBox;
    this.selectedDeveloper = null;
    this.searchQuery = '';
    if (!this.developers.length) {
      alert('No developers available');
      this.showAssignBox = false;
    }
  }

  toggleCategoryBox() {
    this.showCategoryBox = !this.showCategoryBox;
  }

  addCategory() {
    if (!this.newCategory.trim()) return;
    
    this.http.post('http://localhost:8085/api/categories', { category: this.newCategory }).subscribe({
      next: (res) => {
       
        this.categoryList.push(this.newCategory);
        this.newCategory = ''; // Reset the input field
        this.showCategoryBox = false; // Close the category box
      },
      error: () => alert('Failed to add category')
    });
  }

  selectDeveloper(dev: UiDeveloper) {
    this.selectedDeveloper = dev;
  }

  submitAssignment() {
    if (!this.selectedDeveloper) return;

    const payload = { developerId: this.selectedDeveloper.id };
    this.http.post(`http://localhost:8085/api/issues/${this.issue.id}/assign`, payload).subscribe({
      next: () => {
        this.issue.status = 'INPROGRESS';
        this.issue.developerId = this.selectedDeveloper!.id;
        this.assignedDeveloper = this.selectedDeveloper;
        this.selectedDeveloper = null;
        this.showAssignBox = false;
        this.refresh.emit();
        this.close.emit();
      },
      error: () => alert('Failed to assign developer')
    });
  }

  removeDeveloper() {
    this.issue.developerId = null;
    this.assignedDeveloper = null;
  }

  getDeveloperName(devId: number): string {
    const dev = this.developers.find(d => d.id === devId);
    return dev ? dev.username : '';
  }

  filteredDevelopers(): UiDeveloper[] {
    const q = (this.searchQuery || '').toLowerCase().trim();
    if (!q) return this.developers;
    return this.developers.filter(dev => dev.username.toLowerCase().includes(q));
  }

  onCloseModal() {
    this.close.emit();
  }

  markComplete() {
    const payload = {
      status: 'COMPLETED',
      completedReason: 'Marked manually by admin'
    };

    this.http.post(`http://localhost:8085/api/issues/${this.issue.id}/status`, payload).subscribe({
      next: () => {
        this.issue.status = 'COMPLETED';
        this.refresh.emit();
        this.close.emit();
      },
      error: () => alert('Failed to mark as completed.')
    });
  }

  submitComment() {
    if (!this.newComment.trim()) return;
    this.comments.unshift({ author: 'Admin', message: this.newComment.trim() });
    this.newComment = '';
  }
   toggleCommentSidebar() {
    this.showCommentSidebar = !this.showCommentSidebar;
  }
}
