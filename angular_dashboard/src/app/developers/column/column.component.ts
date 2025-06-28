import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CdkDropList, DragDropModule } from '@angular/cdk/drag-drop';
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
  @Input() onDrop: Function = () => {};

  statusTitle: Record<string, string> = {
    PENDING: '🕒 Pending',
    INPROGRESS: '🚧 In Progress',
    COMPLETED: '✅ Completed',
    REJECTED: '❌ Rejected'
  };
}