import { Injectable, signal } from '@angular/core';
import { Difficulty, Report, Result } from './api.service';

export type Mode = 'audio' | 'chat';

@Injectable({ providedIn: 'root' })
export class SessionService {
  topic = signal('');
  difficulty = signal<Difficulty>('medium');
  mode = signal<Mode>('chat');
  total = signal(5);
  results = signal<Result[]>([]);
  report = signal<Report | null>(null);

  start(topic: string, difficulty: Difficulty, mode: Mode, total: number) {
    this.topic.set(topic); this.difficulty.set(difficulty); this.mode.set(mode); this.total.set(total);
    this.results.set([]); this.report.set(null);
  }
}
