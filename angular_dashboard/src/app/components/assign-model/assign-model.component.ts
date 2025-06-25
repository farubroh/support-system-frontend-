

import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClientModule, HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-assign-modal',
  standalone: true,
  imports: [CommonModule, HttpClientModule],
  

  templateUrl: './assign-model.component.html',
  styleUrl: './assign-model.component.css'
})
export class AssignModalComponent {
  @Input() issue: any;
  @Output() onClose = new EventEmitter<void>();
  @Output() onAssigned = new EventEmitter<void>();

  developers: any[] = [];
  assigning = false;

  constructor(private http: HttpClient) {
    this.http.get('http://localhost:8085/api/developers').subscribe({
      next: (data: any) => this.developers = data,
      error: (err) => console.error('Error fetching developers:', err)
    });
  }

  assign(developerId: number) {
    this.assigning = true;
    this.http.post(`http://localhost:8085/api/issues/${this.issue.id}/assign`, { developerId }).subscribe({
      next: () => {
        this.assigning = false;
        this.onAssigned.emit();
      },
      error: () => {
        this.assigning = false;
        alert('Failed to assign developer.');
      }
    });
  }
}