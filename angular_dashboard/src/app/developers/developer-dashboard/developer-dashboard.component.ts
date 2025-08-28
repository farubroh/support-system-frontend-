import { Component, OnInit, computed, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CdkDragDrop, DragDropModule, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { AuthenticationService } from '../../authentication.service';

type StatusKey = 'PENDING' | 'INPROGRESS' | 'COMPLETED' | 'REJECTED';

interface IssueDto {
  issueId: number;
  title: string;
  description?: string;
  status: StatusKey;
  serialId?: string;
  createdAt?: string;
  completedAt?: string;
  rejectedAt?: string;
  completedReason?: string;
  rejectionReason?: string;
}

interface UserDto {
  id?: number;
  username: string;
  role?: string;
  department?: string;
  designation?: string;
}

interface DeveloperSpecificIssueDto {
  createdBy: UserDto;
  issue: IssueDto;
}

interface IssuesOfDeveloperDto {
  PENDING: DeveloperSpecificIssueDto[];
  INPROGRESS: DeveloperSpecificIssueDto[];
  COMPLETED: DeveloperSpecificIssueDto[];
  REJECTED: DeveloperSpecificIssueDto[];
}

interface Card {
  id: number;
  title: string;
  subtitle?: string | null;
  meta?: { views?: number; comments?: number; attachments?: number };
  description?: string;
  done?: boolean;
  status: StatusKey;
  // keep references if needed
  createdBy?: UserDto;
  raw?: DeveloperSpecificIssueDto;
}

interface List {
  title: string;
  key: StatusKey;
  cards: Card[];
}

@Component({
  selector: 'app-developer-dashboard',
  standalone: true,
  imports: [CommonModule, DragDropModule, FormsModule],
  templateUrl: './developer-dashboard.component.html',
  styleUrls: ['./developer-dashboard.component.css']
})
export class DeveloperDashboardComponent implements OnInit {
  constructor(private http: HttpClient, private auth: AuthenticationService) {}

  // search + details pane
  query = signal<string>('');
  selected = signal<Card | null>(null);
  description = signal<string>('');

  // lists
  lists = signal<List[]>([]);

  // derive filtered view
  private readonly filtered = computed<List[]>(() => {
    const q = this.query().toLowerCase().trim();
    if (!q) return this.lists();
    return this.lists().map(list => ({
      ...list,
      cards: list.cards.filter(c =>
        c.title.toLowerCase().includes(q) ||
        (c.description ?? '').toLowerCase().includes(q) ||
        (c.subtitle ?? '').toLowerCase().includes(q)
      )
    }));
  });

  ngOnInit() {
    const user = this.auth.getUser();
    if (!user || !user.id) return;

    // Load issues bucketed by status for this developer (by userId)
    this.http.get<IssuesOfDeveloperDto>(`http://localhost:8085/api/developers/${user.id}/issues`)
      .subscribe(dto => {
        this.inflate(dto);
      });
  }

  /** Builds board lists from backend dto. */
  private inflate(dto: IssuesOfDeveloperDto) {
    const mapCards = (arr: DeveloperSpecificIssueDto[], key: StatusKey): Card[] =>
      (arr || []).map(d => ({
        id: d.issue.issueId,
        title: d.issue.title,
        subtitle: d.createdBy?.username ?? null,
        meta: { views: 0, comments: 0, attachments: 0 },
        description: d.issue.description ?? '',
        done: key === 'COMPLETED',
        status: key,
        createdBy: d.createdBy,
        raw: d
      }));

    this.lists.set([
      { title: 'Pending',     key: 'PENDING',    cards: mapCards(dto.PENDING, 'PENDING') },
      { title: 'In Progress', key: 'INPROGRESS', cards: mapCards(dto.INPROGRESS, 'INPROGRESS') },
      { title: 'Completed',   key: 'COMPLETED',  cards: mapCards(dto.COMPLETED, 'COMPLETED') },
      { title: 'Rejected',    key: 'REJECTED',   cards: mapCards(dto.REJECTED, 'REJECTED') }
    ]);
  }

  /** Used by *ngFor trackBy */
  trackById = (_: number, item: Card) => item.id;

  /** Lists connected for cross-list dragging. */
  connectedTo(i: number): string[] {
    const ids = this.lists().map((_, idx) => `list-${idx}`);
    ids.splice(i, 1);
    return ids;
  }

  /** Handle dnd. Also updates backend status when moved across lists. */
  drop(e: CdkDragDrop<Card[]>) {
    if (e.previousContainer === e.container) {
      moveItemInArray(e.container.data, e.previousIndex, e.currentIndex);
      return;
    }

    // compute from/to status keys
    const fromIdx = this.indexFromListId(e.previousContainer.id);
    const toIdx   = this.indexFromListId(e.container.id);
    if (fromIdx === -1 || toIdx === -1) return;

    const fromKey = this.lists()[fromIdx].key;
    const toKey   = this.lists()[toIdx].key;

    // optimistic UI
    transferArrayItem(
      e.previousContainer.data,
      e.container.data,
      e.previousIndex,
      e.currentIndex
    );

    const moved = e.container.data[e.currentIndex];
    const prevStatus = moved.status;
    moved.status = toKey;
    moved.done = toKey === 'COMPLETED';

    // call backend to update status
    const user = this.auth.getUser();
    const payload = {
      workedBy: user?.id,               // developer’s userId
      fromStatus: fromKey,
      toStatus: toKey,
      rejectionReason: toKey === 'REJECTED' ? 'Rejected by developer' : null,
      completedAnalysis: toKey === 'COMPLETED' ? 'Marked as completed' : null
    };

    this.http.post(`http://localhost:8085/api/issues/${moved.id}/status`, payload).subscribe({
      next: () => {},
      error: () => {
        // revert UI if failed
        transferArrayItem(
          e.container.data,
          e.previousContainer.data,
          e.currentIndex,
          e.previousIndex
        );
        moved.status = prevStatus;
        moved.done = prevStatus === 'COMPLETED';
        alert('Failed to update status.');
      }
    });
  }

  private indexFromListId(id: string): number {
    // id format is "list-<index>"
    const idx = Number((id || '').split('-')[1]);
    return Number.isFinite(idx) ? idx : -1;
    }

  /** Cards query filter used by template. */
  filteredLists(): List[] {
    return this.filtered();
  }

  openCard(card: Card) {
    this.selected.set(card);
    this.description.set(card.description ?? '');
  }

  closeDetails() {
    this.selected.set(null);
  }

  markDone(card: Card) {
    // toggle UI only; status change should be done via drag to Completed/Back
    card.done = !card.done;
  }

  deleteCard(list: List, card: Card) {
    list.cards = list.cards.filter(c => c.id !== card.id);
    this.lists.set(this.lists().map(l => (l.key === list.key ? list : l)));
  }

  addCard(list: List) {
    const id = Date.now();
    list.cards.unshift({
      id,
      title: 'New task',
      subtitle: null,
      meta: { views: 0, comments: 0, attachments: 0 },
      description: '',
      done: false,
      status: list.key
    });
    this.lists.set(this.lists().map(l => (l.key === list.key ? list : l)));
  }

  addList() {
    const idx = this.lists().length + 1;
    this.lists.update(arr => arr.concat([{
      title: `Custom ${idx}`,
      key: 'PENDING',
      cards: []
    }]));
  }

  updateSubtitle(card: Card, value: string) {
    card.subtitle = value;
  }
}
