import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DragDropModule } from '@angular/cdk/drag-drop';

@Component({
  selector: 'app-issue-card',
  standalone: true,
  imports: [CommonModule, DragDropModule],
  templateUrl: './issue-card.component.html',
  styleUrls: ['./issue-card.component.css']
})
export class IssueCardComponent {
  @Input() issue: any;
  ngOnInit() {
  console.log('✅ IssueCard loaded with:', this.issue);
}


  getStatusClass(status: string): string {
    console.log('Status:', status);
    return status?.toLowerCase().replace(/\s+/g, '-');
  }
}
