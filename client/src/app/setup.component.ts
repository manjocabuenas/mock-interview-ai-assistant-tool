import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { ApiService, DIFFICULTIES, Difficulty } from './api.service';
import { Mode, SessionService } from './session.service';

@Component({
  selector: 'app-setup',
  template: `
    <div class="card">
      <h2>1. Choose an interview</h2>
      <div class="row">
        @for (t of topics(); track t) {
          <button [class]="topic() === t ? 'sel' : 'ghost'" (click)="topic.set(t)">{{ t }}</button>
        }
      </div>
    </div>
    <div class="card">
      <h2>2. Choose a difficulty</h2>
      <div class="row">
        @for (d of difficulties; track d) {
          <button [class]="difficulty() === d ? 'sel' : 'ghost'" (click)="difficulty.set(d)">{{ d }}</button>
        }
      </div>
      <p class="muted">Easy = fundamentals · Medium = practical, real-world · Hard = deep internals and trade-offs.</p>
    </div>
    <div class="card">
      <h2>3. Choose a format</h2>
      <div class="row">
        <button [class]="mode() === 'chat' ? 'sel' : 'ghost'" (click)="mode.set('chat')">💬 Chat</button>
        <button [class]="mode() === 'audio' ? 'sel' : 'ghost'" (click)="mode.set('audio')">🎙️ Audio</button>
      </div>
      <p class="muted">Audio: the question is read aloud and you answer by voice (Chrome/Edge). You can still edit the transcript before submitting.</p>
      <label>Number of questions</label>
      <select (change)="total.set(+$any($event.target).value)">
        @for (n of [3, 5, 8, 10]; track n) { <option [value]="n" [selected]="n === total()">{{ n }}</option> }
      </select>
    </div>
    <button [disabled]="!topic()" (click)="start()">Start interview →</button>
  `
})
export class SetupComponent {
  private api = inject(ApiService);
  private session = inject(SessionService);
  private router = inject(Router);
  difficulties = DIFFICULTIES;
  topics = signal<string[]>([]);
  topic = signal('');
  difficulty = signal<Difficulty>('medium');
  mode = signal<Mode>('chat');
  total = signal(5);

  constructor() { this.api.topics().subscribe((t) => this.topics.set(t)); }

  start() {
    this.session.start(this.topic(), this.difficulty(), this.mode(), this.total());
    this.router.navigateByUrl('/interview');
  }
}
