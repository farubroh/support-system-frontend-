import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClientModule, HttpClient } from '@angular/common/http';
import { getStatusColor } from '../utils/get-status-color';
import { IssueViewModalAdminComponent } from "../issue-view-modal-admin/issue-view-modal-admin.component";
import { NgCircleProgressModule } from 'ng-circle-progress';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { SafeHtmlPipe } from "../safe-html.pipe";

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  templateUrl: './admin-dashboard.component.html',
  styleUrls: ['./admin-dashboard.component.css'],
  imports: [IssueViewModalAdminComponent, CommonModule, HttpClientModule, NgCircleProgressModule, SafeHtmlPipe],
  providers: [HttpClient]
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

  calendarHtml: SafeHtml = '';
  currentMonthName = '';
  currentYear = 0;

  statusTabs = [
    { key: 'PENDING', label: 'Pending' },
    { key: 'INPROGRESS', label: 'In Progress' },
    { key: 'COMPLETED', label: 'Completed' },
    { key: 'REJECTED', label: 'Rejected' }
  ];
Array: any;

  constructor(private http: HttpClient, private sanitizer: DomSanitizer) {}

  ngOnInit() {
    this.fetchIssues();
    this.fetchAllIssuesForKPI();
    this.generateCalendar();

    setInterval(() => {
    this.fetchIssues();
    this.fetchAllIssuesForKPI();
  }, 30000);

    
  }

  fetchIssues() {
    this.loading = true;
    this.http.get<any[]>(`http://localhost:8085/api/issues/status/${this.activeTab}`).subscribe(
      (res) => {
        this.issues = res;
        console.log("Fetched Issues:", res);
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

  onTabClick(status: string) {
    this.activeTab = status;
    this.fetchIssues();
    this.fetchAllIssuesForKPI();
  }

  assignDeveloper(developerId: number) {
    this.http.post(`http://localhost:8085/api/issues/${this.selectedIssue.id}/assign`, { developerId: developerId })
      .subscribe({
        next: () => {
          this.selectedIssue.status = 'INPROGRESS';
          this.refreshIssueList();
        },
        error: (err) => alert('Failed to assign developer')
      });
  }

  refreshIssueList() {
    this.fetchIssues();
  }

  getStatusColor = getStatusColor;

  calculateKPIFromAll() {
    const total = this.allIssues.length || 1;
    this.totalIssuesCount = this.allIssues.length;

    const pending = this.allIssues.filter(i => i.status === 'PENDING').length;
    const completed = this.allIssues.filter(i => i.status === 'COMPLETED').length;
    const rejected = this.allIssues.filter(i => i.status === 'REJECTED').length;

    this.pendingPercent = Math.round((pending / total) * 100);
    this.completedPercent = Math.round((completed / total) * 100);
    this.rejectedPercent = Math.round((rejected / total) * 100);

    const userSet = new Set<number>();
    for (let issue of this.allIssues) {
      if (issue.user?.id) userSet.add(issue.user.id);
    }
    this.totalUsersIssued = userSet.size;
  }

  generateCalendar() {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();

    this.currentMonthName = now.toLocaleString('default', { month: 'long' });
    this.currentYear = year;

    const days = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
    const firstDay = new Date(year, month, 1).getDay();
    const numDays = new Date(year, month + 1, 0).getDate();

    let html = '<table><thead><tr>' + days.map(day => `<th>${day}</th>`).join('') + '</tr></thead><tbody><tr>';
    let dayCounter = 1;

    for (let i = 0; i < firstDay; i++) {
      html += '<td></td>';
    }

    for (let i = firstDay; i < 7; i++) {
      html += `<td>${dayCounter++}</td>`;
    }
    html += '</tr>';

    while (dayCounter <= numDays) {
      html += '<tr>';
      for (let i = 0; i < 7; i++) {
        if (dayCounter <= numDays) {
          html += `<td>${dayCounter++}</td>`;
        } else {
          html += '<td></td>';
        }
      }
      html += '</tr>';
    }

    html += '</tbody></table>';
    this.calendarHtml = this.sanitizer.bypassSecurityTrustHtml(html);
  }


  getCategoryColor(category: string): string {
  switch ((category || '').toLowerCase()) {
    case 'edu mail problem': return '#f48fb1';     // pink
    case 'payment problem': return '#ffb74d';      // orange
    case 'quota problem': return '#81c784';        // green
    case 'result problem': return '#64b5f6';        // blue
    case 'login issue': return '#9575cd';           // purple
    default: return '#cfd8dc';                     // grey (default)
  }
}

}
