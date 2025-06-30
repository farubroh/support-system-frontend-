import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpClientModule } from '@angular/common/http';

@Component({
  selector: 'app-assign-modal',
  standalone: true,
  imports: [CommonModule, HttpClientModule],
  templateUrl: './assign-model.component.html',
  styleUrls: ['./assign-model.component.css']
})
export class AssignModalComponent {
  @Input() issue: any;
  @Output() close = new EventEmitter<void>();
  @Output() assigned = new EventEmitter<void>();

  developers: any[] = [];
  assigning = false;

  constructor(private http: HttpClient) {
    this.fetchDevelopers();
  }

  fetchDevelopers() {
    this.http.get<any[]>('http://localhost:8085/api/developers')
      .subscribe({ next: res => this.developers = res });
  }

  // assign(developerId: number) {
  //   this.assigning = true;
  //   this.http.post(`http://localhost:8085/api/issues/${this.issue.id}/assign`, { developerId })
  //     .subscribe({
  //       next: () => this.assigned.emit(),
  //       error: err => alert('Failed to assign developer'),
  //       complete: () => this.assigning = false
  //     });
  // }

  assign(developerId: number | null = null) {
  this.assigning = true;

  // Default to Rafi (developerId=2) if none selected
  const devId = developerId ?? 2;

  this.http.post(`http://localhost:8085/api/issues/${this.issue.id}/assign`, { developerId: devId })
    .subscribe({
      next: () => this.assigned.emit(),
      error: err => alert('Failed to assign developer'),
      complete: () => this.assigning = false
    });
}
}