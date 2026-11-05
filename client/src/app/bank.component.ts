import { Component, computed, inject, signal } from '@angular/core';
import { ApiService, BankQuestion, DIFFICULTIES, Difficulty } from './api.service';

type Tab = 'bank' | 'form' | 'topics';
const PAGE_SIZE = 10;

@Component({
  selector: 'app-bank',
  styles: [`
    .tabs { display: flex; gap: .25rem; border-bottom: 1px solid #cbd3e6; margin-bottom: 1rem; }
    .tabs button { background: none; color: #6b7691; border-radius: 8px 8px 0 0; border-bottom: 3px solid transparent; }
    .tabs button.active { color: #1d2433; border-bottom-color: #3f6df6; font-weight: 600; }
    .tablewrap { overflow-x: auto; }
    table { width: 100%; border-collapse: collapse; }
    th { text-align: left; font-size: .8rem; text-transform: uppercase; color: #6b7691; padding: .5rem; border-bottom: 2px solid #e6ebf7; }
    td { padding: .55rem .5rem; border-bottom: 1px solid #eef1f8; vertical-align: top; }
    td.actions { white-space: nowrap; text-align: right; }
    td.actions button { padding: .3rem .6rem; font-size: .85rem; }
    .pager { justify-content: space-between; margin-top: .8rem; }
  `],
  template: `
    <div class="tabs">
      <button [class.active]="tab() === 'bank'" (click)="go('bank')">📚 Bank ({{ items().length }})</button>
      <button [class.active]="tab() === 'form'" (click)="go('form')">{{ editingId() ? '✏️ Edit Question' : '➕ Add Question' }}</button>
      <button [class.active]="tab() === 'topics'" (click)="go('topics')">🏷️ Topics ({{ topics().length }})</button>
    </div>

    @if (tab() === 'bank') {
      <div class="card">
        <div class="row">
          <input style="flex:2;min-width:160px" placeholder="🔍 Search questions…" [value]="search()"
            (input)="search.set($any($event.target).value); page.set(1)" />
          <select style="flex:1;min-width:130px" (change)="fTopic.set($any($event.target).value); page.set(1)">
            <option value="">All topics</option>
            @for (t of topics(); track t) { <option [value]="t">{{ t }}</option> }
          </select>
          <select style="flex:1;min-width:130px" (change)="fDiff.set($any($event.target).value); page.set(1)">
            <option value="">All levels</option>
            @for (d of difficulties; track d) { <option [value]="d">{{ d }}</option> }
          </select>
        </div>

        <div class="tablewrap" style="margin-top:.8rem">
          <table>
            <thead><tr><th>Topic</th><th>Level</th><th>Question</th><th></th></tr></thead>
            <tbody>
              @for (q of pageItems(); track q.id) {
                <tr>
                  <td>{{ q.topic }}</td>
                  <td><span class="badge" [class]="q.difficulty">{{ q.difficulty }}</span></td>
                  <td>{{ q.text }}</td>
                  <td class="actions">
                    <button class="ghost" (click)="edit(q)">✏️ Edit</button>
                    <button class="danger" (click)="remove(q)">Delete</button>
                  </td>
                </tr>
              } @empty {
                <tr><td colspan="4" class="muted">No questions match your filters.</td></tr>
              }
            </tbody>
          </table>
        </div>

        <div class="row pager">
          <span class="muted">{{ filtered().length }} question(s) · page {{ safePage() }} of {{ totalPages() }}</span>
          <div class="row">
            <button class="ghost" [disabled]="safePage() <= 1" (click)="page.set(safePage() - 1)">← Prev</button>
            <button class="ghost" [disabled]="safePage() >= totalPages()" (click)="page.set(safePage() + 1)">Next →</button>
          </div>
        </div>
      </div>
    }

    @if (tab() === 'form') {
      <div class="card">
        <h2>{{ editingId() ? 'Edit question' : 'Add a question' }}</h2>
        <div class="row">
          <div style="flex:1">
            <label>Topic</label>
            <select (change)="topic.set($any($event.target).value)">
              @for (t of topics(); track t) { <option [value]="t" [selected]="t === topic()">{{ t }}</option> }
            </select>
          </div>
          <div>
            <label>Difficulty</label>
            <div class="row">
              @for (d of difficulties; track d) {
                <button [class]="difficulty() === d ? 'sel' : 'ghost'" (click)="difficulty.set(d)">{{ d }}</button>
              }
            </div>
          </div>
        </div>
        <label>Question</label>
        <textarea [value]="text()" (input)="text.set($any($event.target).value)"></textarea>
        <label>Reference answer (optional, helps the AI grade accurately)</label>
        <textarea [value]="answer()" (input)="answer.set($any($event.target).value)"></textarea>
        <div class="row" style="margin-top:.8rem">
          <button [disabled]="!topic() || !text().trim()" (click)="save()">{{ editingId() ? 'Save changes' : 'Add question' }}</button>
          @if (editingId()) { <button class="ghost" (click)="cancelEdit()">Cancel</button> }
          @if (msg()) { <span class="muted">{{ msg() }}</span> }
        </div>
      </div>
    }

    @if (tab() === 'topics') {
      <div class="card">
        <h2>Topics</h2>
        <div class="row">
          @for (t of topics(); track t) {
            <span class="chip">{{ t }} <small class="muted">{{ count(t) }}</small>
              <button class="x" [disabled]="count(t) > 0" (click)="removeTopic(t)"
                [title]="count(t) > 0 ? 'Delete or move its questions first' : 'Delete topic'">✕</button>
            </span>
          }
        </div>
        <div class="row" style="margin-top:.8rem">
          <input style="flex:1" placeholder="New topic, e.g. Python" [value]="newTopic()"
            (input)="newTopic.set($any($event.target).value)" (keyup.enter)="addTopic()" />
          <button [disabled]="!newTopic().trim()" (click)="addTopic()">Add topic</button>
        </div>
        @if (msg()) { <p class="muted">{{ msg() }}</p> }
      </div>
    }
  `
})
export class BankComponent {
  private api = inject(ApiService);
  difficulties = DIFFICULTIES;
  tab = signal<Tab>('bank');
  topics = signal<string[]>([]);
  items = signal<BankQuestion[]>([]);

  editingId = signal<string | null>(null);
  topic = signal('');
  difficulty = signal<Difficulty>('medium');
  text = signal('');
  answer = signal('');
  newTopic = signal('');
  msg = signal('');

  search = signal('');
  fTopic = signal('');
  fDiff = signal('');
  page = signal(1);

  filtered = computed(() => {
    const s = this.search().trim().toLowerCase();
    const order = (d: Difficulty) => DIFFICULTIES.indexOf(d);
    return this.items()
      .filter((q) => (!this.fTopic() || q.topic === this.fTopic())
        && (!this.fDiff() || q.difficulty === this.fDiff())
        && (!s || q.text.toLowerCase().includes(s)))
      .sort((a, b) => a.topic.localeCompare(b.topic) || order(a.difficulty) - order(b.difficulty));
  });
  totalPages = computed(() => Math.max(1, Math.ceil(this.filtered().length / PAGE_SIZE)));
  safePage = computed(() => Math.min(this.page(), this.totalPages()));
  pageItems = computed(() => {
    const start = (this.safePage() - 1) * PAGE_SIZE;
    return this.filtered().slice(start, start + PAGE_SIZE);
  });

  constructor() { this.loadAll(); }

  go(t: Tab) { this.tab.set(t); this.msg.set(''); }
  count(t: string) { return this.items().filter((q) => q.topic === t).length; }

  loadAll() {
    this.api.topics().subscribe((t) => { this.topics.set(t); if (!this.topic()) this.topic.set(t[0] ?? ''); });
    this.api.questions().subscribe((q) => this.items.set(q));
  }

  save() {
    const body = { topic: this.topic(), difficulty: this.difficulty(), text: this.text(), answer: this.answer() };
    const id = this.editingId();
    const req = id ? this.api.updateQuestion(id, body) : this.api.addQuestion(body);
    req.subscribe({
      next: () => {
        this.text.set(''); this.answer.set(''); this.editingId.set(null); this.loadAll();
        if (id) this.go('bank'); else this.msg.set('Added ✓');
      },
      error: (e) => this.msg.set(e.error?.error || 'Save failed')
    });
  }

  edit(q: BankQuestion) {
    this.editingId.set(q.id); this.topic.set(q.topic); this.difficulty.set(q.difficulty);
    this.text.set(q.text); this.answer.set(q.answer ?? '');
    this.go('form');
  }

  cancelEdit() { this.editingId.set(null); this.text.set(''); this.answer.set(''); this.go('bank'); }

  remove(q: BankQuestion) {
    if (!confirm('Delete this question?')) return;
    this.api.deleteQuestion(q.id).subscribe(() => this.loadAll());
  }

  addTopic() {
    const name = this.newTopic().trim();
    if (!name) return;
    this.api.addTopic(name).subscribe({
      next: () => { this.newTopic.set(''); this.msg.set(''); this.loadAll(); },
      error: (e) => this.msg.set(e.error?.error || 'Could not add topic')
    });
  }

  removeTopic(t: string) {
    this.api.deleteTopic(t).subscribe({
      next: () => { if (this.topic() === t) this.topic.set(''); this.loadAll(); },
      error: (e) => this.msg.set(e.error?.error || 'Could not delete topic')
    });
  }
}
