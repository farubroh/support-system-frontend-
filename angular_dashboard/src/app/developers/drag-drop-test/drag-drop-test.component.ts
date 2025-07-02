import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  CdkDropList,
  CdkDrag,
  CdkDragDrop,
  DragDropModule,
  moveItemInArray,
  transferArrayItem
} from '@angular/cdk/drag-drop';

@Component({
  selector: 'app-drag-drop-test',
  standalone: true,
  imports: [CommonModule, DragDropModule],
  templateUrl: './drag-drop-test.component.html',
  styleUrls: ['./drag-drop-test.component.css']
})
export class DragDropTestComponent {
  todo = ['Get to work', 'Pick up groceries', 'Go home'];
  done = ['Wake up', 'Brush teeth', 'Check email'];

  drop(event: CdkDragDrop<string[]>) {
    console.log('🧪 Drag-drop event:', event);

    if (event.previousContainer === event.container) {
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
    } else {
      transferArrayItem(
        event.previousContainer.data,
        event.container.data,
        event.previousIndex,
        event.currentIndex
      );
    }
  }
}
