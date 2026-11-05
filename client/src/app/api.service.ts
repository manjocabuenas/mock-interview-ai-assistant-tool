import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';

export type Difficulty = 'easy' | 'medium' | 'hard';
export const DIFFICULTIES: Difficulty[] = ['easy', 'medium', 'hard'];

export interface QuestionInput { topic: string; difficulty: Difficulty; text: string; answer: string; }
export interface BankQuestion { id: string; topic: string; difficulty: Difficulty; text: string; answer?: string; }
export interface NextQuestion { question: string; referenceAnswer: string; source: 'bank' | 'ai'; }
export interface Evaluation {
  score: number; verdict: 'correct' | 'partially_correct' | 'incorrect';
  feedback: string; idealAnswer: string; strengths: string[]; weaknesses: string[];
}
export interface Result { question: string; answer: string; evaluation: Evaluation; }
export interface Report {
  overallScore: number; readiness: 'ready' | 'almost' | 'not_ready';
  summary: string; strengths: string[]; weaknesses: string[]; studyPlan: string[];
}

@Injectable({ providedIn: 'root' })
export class ApiService {
  private http = inject(HttpClient);
  topics = () => this.http.get<string[]>('/api/topics');
  addTopic = (name: string) => this.http.post<{ name: string }>('/api/topics', { name });
  deleteTopic = (name: string) => this.http.delete<void>(`/api/topics/${encodeURIComponent(name)}`);

  questions = () => this.http.get<BankQuestion[]>('/api/questions');
  addQuestion = (q: QuestionInput) => this.http.post<BankQuestion>('/api/questions', q);
  updateQuestion = (id: string, q: QuestionInput) => this.http.put<BankQuestion>(`/api/questions/${id}`, q);
  deleteQuestion = (id: string) => this.http.delete<void>(`/api/questions/${id}`);

  next = (topic: string, difficulty: Difficulty, asked: string[]) =>
    this.http.post<NextQuestion>('/api/interview/next', { topic, difficulty, asked });
  evaluate = (b: { topic: string; difficulty: Difficulty; question: string; answer: string; referenceAnswer: string }) =>
    this.http.post<Evaluation>('/api/interview/evaluate', b);
  report = (topic: string, difficulty: Difficulty, results: Result[]) =>
    this.http.post<Report>('/api/interview/report', { topic, difficulty, results });
}
