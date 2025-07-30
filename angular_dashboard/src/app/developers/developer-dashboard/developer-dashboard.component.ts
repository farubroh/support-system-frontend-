import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CdkDragDrop, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';
import { ColumnComponent } from '../column/column.component';
import { CommonModule } from '@angular/common';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { DeveloperIssueModalComponent } from '../developer-issue-modal/developer-issue-modal.component';

@Component({
  selector: 'app-developer-dashboard',
  standalone: true,
  imports: [CommonModule, DragDropModule, ColumnComponent, DeveloperIssueModalComponent],
  templateUrl: './developer-dashboard.component.html',
  styleUrls: ['./developer-dashboard.component.css'],
})
export class DeveloperDashboardComponent implements OnInit {
  user: any;
  assignedIssues: any[] = [];
  developers: { name: string }[] = []; // Array to hold developers

  developerImages: { [key: string]: string } = {
    'Rafi': '/New_male.png',  // Example developer image paths
    'Susmoy': '/black.png',
    'Hasan': '/man.png',
    // Add other developers here...
  };


  issuesByStatus: { [key: string]: any[] } = {
    PENDING: [],
    INPROGRESS: [],
    COMPLETED: [],
    REJECTED: [],
  };
  selectedIssue: any = null;

  statusOrder = ['PENDING', 'INPROGRESS', 'COMPLETED', 'REJECTED'];

  constructor(private http: HttpClient) {}

  ngOnInit() {
  const storedUser = sessionStorage.getItem('helpdeskUser');
  if (storedUser) {
    this.user = JSON.parse(storedUser);
    console.log('Logged in user:', this.user); // Log the user object
    this.fetchDevelopers();
    this.fetchIssues();
    this.getAssignedIssues();
  } else {
    console.error('No user found in sessionStorage');
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

    getDeveloperImage(developerName: string): string {
    return this.developerImages[developerName] || '/New_male.png';  // Default image if no match found
  }
  
 fetchDevelopers() {
  // Simulate the fetch from an API
  const url = 'http://localhost:8085/api/developers'; // Assuming the backend has a /developers endpoint

  this.http.get<any[]>(url).subscribe({
    next: (res) => {
      // Assuming the response is an array of developer objects with a 'name' property
      
      this.developers = res.map((developer: any) => ({ name: developer.username }));
     
      
    },
    error: (err) => console.error('Failed to load developers:', err),
  });
}


  fetchIssues() {
  const developerId = this.user.id;
  const url = `http://localhost:8085/api/developers/${developerId}/issues`;

  this.http.get<any>(url).subscribe({
    next: (res) => {
      console.log('API Response:', res);

      this.issuesByStatus['PENDING'] = res.PENDING?.map((d: any) => ({ ...d.issue })) || [];
      this.issuesByStatus['INPROGRESS'] = res.INPROGRESS?.map((d: any) => ({ ...d.issue })) || [];
      this.issuesByStatus['COMPLETED'] = res.COMPLETED?.map((d: any) => ({ ...d.issue })) || [];
      this.issuesByStatus['REJECTED'] = res.REJECTED?.map((d: any) => ({ ...d.issue })) || [];

      // Update filteredKanbanIssues if you are showing Kanban view for all developers or selected
      // Update filteredKanbanIssues if you are showing Kanban view for all developers or selected
      this.filteredKanbanIssues['PENDING'] = [...this.issuesByStatus['PENDING']];
      this.filteredKanbanIssues['INPROGRESS'] = [...this.issuesByStatus['INPROGRESS']];
      this.filteredKanbanIssues['COMPLETED'] = [...this.issuesByStatus['COMPLETED']];
      this.filteredKanbanIssues['REJECTED'] = [...this.issuesByStatus['REJECTED']];
    },
    error: (err) => console.error('Failed to load developer issues:', err),
  });
}

//    getAssignedIssues() {
//   const url = 'http://localhost:8085/api/issues/all_admin'; // Assuming this endpoint gives all issues

//   this.http.get<any[]>(url).subscribe({
//     next: (res) => {
//       // Filter out issues that are unassigned (those without a developerName)
//       this.assignedIssues = res.filter(issue => issue.developerName);

//       console.log('Assigned Issues:', this.assignedIssues);  // Log assigned issues for debugging
//     },
//     error: (err) => console.error('Failed to load all issues:', err),
//   });
// }
getAssignedIssues() {
  const url = 'http://localhost:8085/api/issues/all_admin';
  this.http.get<any[]>(url).subscribe({
    next: (res) => {
      this.assignedIssues = res.filter(issue => issue.developerName);
      this.filteredAssignedIssues = [...this.assignedIssues]; // Show all by default
    },
    error: (err) => console.error('Failed to load all issues:', err),
  });
}


handleDrop({ event, targetStatus }: { event: CdkDragDrop<any[]>, targetStatus: string }) {
  const prevContainer = event.previousContainer;
  const currContainer = event.container;
  const movedIssue = prevContainer.data[event.previousIndex];

  const prevStatus = prevContainer.id;
  const currStatus = targetStatus;

  console.log('🔥 Drop triggered in column:', targetStatus);
  console.log('Previous Container ID:', prevStatus);
  console.log('Current Container ID:', currStatus);
  console.log('From index:', event.previousIndex, '→ To index:', event.currentIndex);

  if (prevStatus === currStatus) {
    moveItemInArray(currContainer.data, event.previousIndex, event.currentIndex);
  } else {
    transferArrayItem(
      prevContainer.data,
      currContainer.data,
      event.previousIndex,
      event.currentIndex
    );

    if (movedIssue?.issueId) {
      this.updateIssueStatus(movedIssue.issueId, targetStatus);
    }
  }
}





  updateIssueStatus(issueId: number, newStatus: string) {
  const payload = {
    toStatus: newStatus,
    workedBy: this.user.id,
    completedAnalysis: 'Completed by developer',
    rejectionReason: 'Rejected by developer',
  };

  this.http.put(`http://localhost:8085/api/issues/${issueId}/status`, payload).subscribe({
    next: () => {
      console.log('✅ Status updated to', newStatus);
      this.fetchIssues(); // refresh after update
    },
    error: (err) => console.error('❌ Failed to update status:', err),
  });
}


  openIssueModal(issue: any) {
    this.selectedIssue = issue;
  }

  closeModal() {
    this.selectedIssue = null;
  }

  refreshAfterAction() {
    this.fetchIssues();
  }
  selectedDeveloper: string | null = null;
filteredAssignedIssues: any[] = [];




filteredKanbanIssues: { [key: string]: any[] } = {
  PENDING: [],
  INPROGRESS: [],
  COMPLETED: [],
  REJECTED: []
};
isKanbanView: boolean = false;

filterByDeveloper(name: string) {
  if (this.selectedDeveloper === name) {
    // Reset back to all issues in table view
    this.selectedDeveloper = null;
    this.isKanbanView = false;
  } else {
    this.selectedDeveloper = name;
    this.isKanbanView = true;

    // Reset & group issues by status for the clicked developer
    const devIssues = this.assignedIssues.filter(
      issue => issue.developerName === name
    );

    // Group them by status
    this.filteredKanbanIssues = {
      PENDING: devIssues.filter(i => i.status === 'PENDING'),
      INPROGRESS: devIssues.filter(i => i.status === 'INPROGRESS'),
      COMPLETED: devIssues.filter(i => i.status === 'COMPLETED'),
      REJECTED: devIssues.filter(i => i.status === 'REJECTED'),
    };
  }
}


}
