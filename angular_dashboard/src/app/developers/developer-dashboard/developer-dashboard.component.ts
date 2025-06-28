import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClientModule, HttpClient } from '@angular/common/http';
import { ColumnComponent } from '../column/column.component';
import { DragDropModule, CdkDragDrop } from '@angular/cdk/drag-drop';
import { catchError } from 'rxjs/operators';
import { of } from 'rxjs';

@Component({
  selector: 'app-developer-dashboard',
  standalone: true,
  imports: [CommonModule, HttpClientModule, DragDropModule, ColumnComponent],
  templateUrl: './developer-dashboard.component.html',
  styleUrls: ['./developer-dashboard.component.css']
})
export class DeveloperDashboardComponent implements OnInit {
  @Input() user!: any;

  statusOrder = ['PENDING', 'INPROGRESS', 'COMPLETED', 'REJECTED'];
  issuesByStatus: Record<string, any[]> = {
    PENDING: [],
    INPROGRESS: [],
    COMPLETED: [],
    REJECTED: []
  };

  constructor(private http: HttpClient) {}

  ngOnInit() {
    // this.http.get(`http://localhost:8085/api/developers/${this.user.id}/issues`)
    //   .pipe(catchError(() => of({})))
    //   .subscribe((res: any) => {
    //     this.issuesByStatus = res;
    //   });

    this.http.get(`http://localhost:8085/api/developers/${this.user.id}/issues`)
  .pipe(catchError(() => of({
    PENDING: [],
    INPROGRESS: [],
    COMPLETED: [],
    REJECTED: []
  })))
  .subscribe((res: any) => {
    this.issuesByStatus = res;
  });
  }

  // handleDragDrop(event: CdkDragDrop<any[]>, destStatus: string) {
  //   const sourceStatus = event.previousContainer.id;
  //   if (!event || sourceStatus === destStatus) return;

  //   const movedIssue = this.issuesByStatus[sourceStatus][event.previousIndex];

  //   this.http.put(`http://localhost:8085/api/issues/${movedIssue.issue.issueId}/status`, {
  //     workedBy: this.user.id,
  //     fromStatus: sourceStatus,
  //     toStatus: destStatus,
  //     rejectionReason: destStatus === 'REJECTED' ? 'Spam' : null
  //   }).subscribe({
  //     next: () => {
  //       const removed = this.issuesByStatus[sourceStatus].splice(event.previousIndex, 1)[0];
  //       removed.status = destStatus;
  //       this.issuesByStatus[destStatus].splice(event.currentIndex, 0, removed);
  //     },
  //     error: () => alert('Failed to update status.')
  //   });
  // }

  // getDropHandler(status: string) {
  //   return (event: CdkDragDrop<any[]>) => this.handleDragDrop(event, status);
  // }


  handleDragDrop(event: CdkDragDrop<any[]>, destStatus: string) {
  const sourceStatus = event.previousContainer.id;
  if (!event || sourceStatus === destStatus) return;

  const movedIssue = this.issuesByStatus[sourceStatus][event.previousIndex];

  const payload = {
    workedBy: this.user.id,
    fromStatus: sourceStatus,
    toStatus: destStatus,
    rejectionReason: destStatus === 'REJECTED' ? 'Spam' : null
  };

  this.http.put(`http://localhost:8085/api/issues/${movedIssue.issue.issueId}/status`, payload)
    .subscribe({
      next: () => {
        const removed = this.issuesByStatus[sourceStatus].splice(event.previousIndex, 1)[0];
        removed.status = destStatus;
        this.issuesByStatus[destStatus].splice(event.currentIndex, 0, removed);
      },
      error: () => alert('Failed to update status.')
    });
}

getDropHandler(status: string) {
    return (event: CdkDragDrop<any[]>) => this.handleDragDrop(event, status);
  }
}