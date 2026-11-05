import { Component, OnDestroy, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { ApiService, Evaluation } from './api.service';
import { SessionService } from './session.service';
import { SpeechService } from './speech.service';

@Component({
  selector: 'app-interview',
  template: `
    <div class="card">
      <div class="row"><b>{{ session.topic() }} interview</b> <span class="badge" [class]="session.difficulty()">{{ session.difficulty() }}</span>
        <span class="muted">Question {{ index() + 1 }} of {{ session.total() }}</span></div>
    </div>

    @if (error()) { <p class="err">{{ error() }}</p> }

    <div class="card">
      @if (loading() && !question()) { <p class="muted">Preparing question…</p> }
      @else {
        <h3>{{ question() }}</h3>
        @if (session.mode() === 'audio') { <button class="ghost" (click)="speech.speak(question())">🔊 Repeat question</button> }
      }
    </div>

    @if (!evaluation() && question()) {
      <div class="card">
        <label>Your answer</label>
        <textarea [value]="answer()" (input)="answer.set($any($event.target).value)"
          placeholder="Type your answer, or use the mic…"></textarea>
        <div class="row" style="margin-top:.8rem">
          @if (session.mode() === 'audio') {
            @if (speech.sttSupported) {
              <button [class]="listening() ? 'danger' : 'ghost'" (click)="toggleMic()">
                {{ listening() ? '⏹ Stop recording' : '🎙️ Start recording' }}
              </button>
            } @else { <span class="err">Speech recognition isn't supported in this browser. Use Chrome or Edge.</span> }
          }
          <button [disabled]="!answer().trim() || loading()" (click)="submit()">
            {{ loading() ? 'Grading…' : 'Submit answer' }}
          </button>
        </div>
      </div>
    }

    @if (evaluation(); as ev) {
      <div class="card">
        <div class="row"><span class="badge" [class]="ev.verdict">{{ ev.verdict.replace('_', ' ') }}</span>
          <b>{{ ev.score }}/10</b></div>
        <p>{{ ev.feedback }}</p>
        <b>Model answer</b><p>{{ ev.idealAnswer }}</p>
        <button (click)="next()" [disabled]="loading()">
          {{ index() + 1 >= session.total() ? 'Finish & see report' : 'Next question →' }}
        </button>
      </div>
    }
  `
})
export class InterviewComponent implements OnDestroy {
  api = inject(ApiService);
  session = inject(SessionService);
  speech = inject(SpeechService);
  private router = inject(Router);

  index = signal(0);
  question = signal('');
  referenceAnswer = '';
  answer = signal('');
  evaluation = signal<Evaluation | null>(null);
  loading = signal(false);
  listening = signal(false);
  error = signal('');

  constructor() {
    if (!this.session.topic()) { this.router.navigateByUrl('/'); return; }
    this.loadQuestion();
  }

  ngOnDestroy() { this.speech.stopSpeaking(); this.speech.stopListening(); }

  private asked() { return this.session.results().map((r) => r.question).concat(this.question() ? [this.question()] : []); }

  loadQuestion() {
    this.loading.set(true); this.error.set(''); this.answer.set(''); this.evaluation.set(null);
    const asked = this.session.results().map((r) => r.question);
    this.api.next(this.session.topic(), this.session.difficulty(), asked).subscribe({
      next: (q) => {
        this.question.set(q.question); this.referenceAnswer = q.referenceAnswer; this.loading.set(false);
        if (this.session.mode() === 'audio') this.speech.speak(q.question);
      },
      error: (e) => { this.error.set(e.error?.error || 'Failed to load question'); this.loading.set(false); }
    });
  }

  toggleMic() {
    if (this.listening()) { this.speech.stopListening(); return; }
    this.speech.stopSpeaking();
    this.listening.set(true);
    this.speech.startListening(this.answer(), (t) => this.answer.set(t), () => this.listening.set(false));
  }

  submit() {
    if (this.listening()) this.speech.stopListening();
    this.loading.set(true); this.error.set('');
    this.api.evaluate({
      topic: this.session.topic(), difficulty: this.session.difficulty(), question: this.question(),
      answer: this.answer(), referenceAnswer: this.referenceAnswer
    }).subscribe({
      next: (ev) => {
        this.evaluation.set(ev); this.loading.set(false);
        this.session.results.update((r) => [...r, { question: this.question(), answer: this.answer(), evaluation: ev }]);
        if (this.session.mode() === 'audio') this.speech.speak(ev.feedback);
      },
      error: (e) => { this.error.set(e.error?.error || 'Grading failed'); this.loading.set(false); }
    });
  }

  next() {
    this.speech.stopSpeaking();
    if (this.index() + 1 >= this.session.total()) { this.finish(); return; }
    this.index.update((i) => i + 1);
    this.loadQuestion();
  }

  private finish() {
    this.loading.set(true);
    this.api.report(this.session.topic(), this.session.difficulty(), this.session.results()).subscribe({
      next: (r) => { this.session.report.set(r); this.router.navigateByUrl('/report'); },
      error: (e) => { this.error.set(e.error?.error || 'Report failed'); this.loading.set(false); }
    });
  }
}
