import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { SessionService } from './session.service';

@Component({
  selector: 'app-report',
  template: `
    @if (session.report(); as r) {
      <div class="card">
        <h2>{{ session.topic() }} · {{ session.difficulty() }} interview report</h2>
        <div class="row">
          <span class="score">{{ r.overallScore }}/100</span>
          <span class="badge" [class]="r.readiness">
            {{ r.readiness === 'ready' ? 'Ready for a real interview' : r.readiness === 'almost' ? 'Almost ready' : 'Not ready yet' }}
          </span>
        </div>
        <p>{{ r.summary }}</p>
      </div>
      <div class="card"><h3>💪 Strengths</h3><ul>@for (s of r.strengths; track s) { <li>{{ s }}</li> }</ul></div>
      <div class="card"><h3>⚠️ Weaknesses</h3><ul>@for (s of r.weaknesses; track s) { <li>{{ s }}</li> }</ul></div>
      <div class="card"><h3>📚 Study plan</h3><ul>@for (s of r.studyPlan; track s) { <li>{{ s }}</li> }</ul></div>
      <div class="card">
        <h3>Question breakdown</h3>
        @for (x of session.results(); track x.question) {
          <p><span class="badge" [class]="x.evaluation.verdict">{{ x.evaluation.score }}/10</span> {{ x.question }}</p>
        }
      </div>
      <button (click)="router.navigateByUrl('/')">Start another interview</button>
    }
  `
})
export class ReportComponent {
  session = inject(SessionService);
  router = inject(Router);
  constructor() { if (!this.session.report()) this.router.navigateByUrl('/'); }
}
