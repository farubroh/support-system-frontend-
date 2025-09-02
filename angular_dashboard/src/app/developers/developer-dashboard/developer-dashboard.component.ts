import { Component, OnInit, computed, signal } from '@angular/core';
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
  createdBy?: UserDto; // reporter
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

  // extra details for selected card
  loadingDetails = false;
  selectedFiles: string[] = [];
  selectedIssuerUserId: number | null = null; // needed to build file URLs
  completeReason = '';
  rejectReason = '';

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
    const userId = this.getUserId();
    if (!userId) {
      console.error('[DeveloperBoard] No userId found in auth payload.');
      return;
    }

    // Load issues bucketed by status for this developer (by userId)
    this.http.get<IssuesOfDeveloperDto>(`http://localhost:8085/api/developers/${userId}/issues`)
      .subscribe({
        next: (dto) => this.inflate(dto),
        error: (e) => console.error('Failed to load developer issues', e)
      });
  }

  /** Supports several login payload shapes */
  private getUserId(): number | null {
    const u: any = this.auth.getUser();
    if (!u) return null;
    return u.id ?? u?.user?.id ?? u?.usrId ?? null;
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

  trackById = (_: number, item: Card) => item.id;

  connectedTo(i: number): string[] {
    const ids = this.lists().map((_, idx) => `list-${idx}`);
    ids.splice(i, 1);
    return ids;
  }

  /** Drag & drop across lists:
   *  - No prompts, no alerts.
   *  - Reasons are optional; dev can fill in from the drawer later.
   */
  drop(e: CdkDragDrop<Card[]>) {
    if (e.previousContainer === e.container) {
      moveItemInArray(e.container.data, e.previousIndex, e.currentIndex);
      return;
    }

    const fromIdx = this.indexFromListId(e.previousContainer.id);
    const toIdx   = this.indexFromListId(e.container.id);
    if (fromIdx === -1 || toIdx === -1) return;

    const fromKey = this.lists()[fromIdx].key;
    const toKey   = this.lists()[toIdx].key;

    // optimistic UI
    transferArrayItem(e.previousContainer.data, e.container.data, e.previousIndex, e.currentIndex);

    const moved = e.container.data[e.currentIndex];
    const prevStatus = moved.status;
    moved.status = toKey;
    moved.done = toKey === 'COMPLETED';

    // send update with no forced reasons
    const payload = {
      workedBy: this.getUserId(),
      fromStatus: fromKey,
      toStatus: toKey,
      rejectionReason: null,
      completedAnalysis: null
    };

    this.http.post(`http://localhost:8085/api/issues/${moved.id}/status`, payload).subscribe({
      next: () => {},
      error: () => {
        // revert on failure
        transferArrayItem(e.container.data, e.previousContainer.data, e.currentIndex, e.previousIndex);
        moved.status = prevStatus;
        moved.done = prevStatus === 'COMPLETED';
        console.warn('Failed to update status.');
      }
    });
  }

  private indexFromListId(id: string): number {
    const idx = Number((id || '').split('-')[1]);
    return Number.isFinite(idx) ? idx : -1;
  }

  filteredLists(): List[] {
    return this.filtered();
  }

  // -------------------------
  // Details Drawer
  // -------------------------
  openCard(card: Card) {
    this.selected.set(card);
    this.description.set(card.description ?? '');
    this.completeReason = '';
    this.rejectReason = '';
    this.selectedFiles = [];
    this.selectedIssuerUserId = null;

    // load files & reasons for this issue using the admin-by-status endpoint
    this.loadingDetails = true;
    this.http.get<any[]>(`http://localhost:8085/api/issues/status/${card.status}`).subscribe({
      next: (rows) => {
        const row = (rows || []).find((r: any) => r.id === card.id);
        if (row) {
          this.selectedFiles = row.files || [];
          this.selectedIssuerUserId = row.user?.id ?? null;
          this.completeReason = row.completedReason || '';
          this.rejectReason   = row.rejectedReason  || '';
        }
        this.loadingDetails = false;
      },
      error: () => { this.loadingDetails = false; }
    });
  }

  closeDetails() {
    this.selected.set(null);
    this.completeReason = '';
    this.rejectReason = '';
    this.selectedFiles = [];
    this.selectedIssuerUserId = null;
  }

  /** Mark (or re-save) as Completed with optional reason. */
  completeFromDetails() {
    const s = this.selected();
    if (!s) return;

    const payload = {
      workedBy: this.getUserId(),
      fromStatus: s.status,
      toStatus: 'COMPLETED' as StatusKey,
      rejectionReason: null,
      completedAnalysis: (this.completeReason || '').trim() || null
    };

    if (s.status !== 'COMPLETED') this.moveCard(s, s.status, 'COMPLETED');

    this.http.post(`http://localhost:8085/api/issues/${s.id}/status`, payload).subscribe({
      next: () => { this.closeDetails(); },
      error: () => {
        if (s.status !== 'COMPLETED') this.moveCard(s, 'COMPLETED', s.status);
        console.warn('Failed to complete/update reason.');
      }
    });
  }

  /** Mark (or re-save) as Rejected with optional reason. */
  rejectFromDetails() {
    const s = this.selected();
    if (!s) return;

    const payload = {
      workedBy: this.getUserId(),
      fromStatus: s.status,
      toStatus: 'REJECTED' as StatusKey,
      rejectionReason: (this.rejectReason || '').trim() || null,
      completedAnalysis: null
    };

    if (s.status !== 'REJECTED') this.moveCard(s, s.status, 'REJECTED');

    this.http.post(`http://localhost:8085/api/issues/${s.id}/status`, payload).subscribe({
      next: () => { this.closeDetails(); },
      error: () => {
        if (s.status !== 'REJECTED') this.moveCard(s, 'REJECTED', s.status);
        console.warn('Failed to reject/update reason.');
      }
    });
  }

  /** Utility to move a card between lists in local state. */
  private moveCard(card: Card, from: StatusKey, to: StatusKey) {
    const lists = this.lists();

    const fromList = lists.find(l => l.key === from);
    const toList   = lists.find(l => l.key === to);
    if (!fromList || !toList) return;

    fromList.cards = fromList.cards.filter(c => c.id !== card.id);
    const clone: Card = { ...card, status: to, done: to === 'COMPLETED' };
    toList.cards = [clone, ...toList.cards];

    this.lists.set(lists.map(l => {
      if (l.key === from) return { ...l, cards: fromList.cards };
      if (l.key === to)   return { ...l, cards: toList.cards };
      return l;
    }));
  }

  // UI helpers
  markDone(card: Card) {
    // visual only (real status change should be via drag or drawer buttons)
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
