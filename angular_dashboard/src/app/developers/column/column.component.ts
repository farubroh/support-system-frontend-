import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CdkDropList, CdkDragDrop, DragDropModule } from '@angular/cdk/drag-drop';
import { IssueCardComponent } from '../issue-card/issue-card.component';

@Component({
  selector: 'app-column',
  standalone: true,
  imports: [CommonModule, DragDropModule, IssueCardComponent],
  templateUrl: './column.component.html',
  styleUrls: ['./column.component.css']
})
export class ColumnComponent {
  @Input() status!: string;
  @Input() issues: any[] = [];
  @Input() connectedTo: string[] = [];
  @Output() issueDropped = new EventEmitter<{ event: CdkDragDrop<any[]>, targetStatus: string }>();

  statusTitle: Record<string, string> = {
    PENDING: '🕒 Pending',
    INPROGRESS: '🚧 In Progress',
    COMPLETED: '✅ Completed',
    REJECTED: '❌ Rejected'
  };

  onDropWrapper(event: CdkDragDrop<any[]>) {
  console.log('🔥 Drop triggered in column:', this.status); // ✅ Add this
  this.issueDropped.emit({ event, targetStatus: this.status });
}

}
