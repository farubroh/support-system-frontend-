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
  console.log('🧪 Issue status:', this.issue?.status);
}



  getStatusClass(status: string): string {
  return status?.toLowerCase().replace(/\s+/g, '-'); // e.g., "INPROGRESS" -> "inprogress"
}

}
