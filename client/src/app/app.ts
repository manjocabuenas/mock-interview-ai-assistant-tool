import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <nav>
      <b>🎤 Mock Interview AI Assistant</b>
      <a routerLink="/" routerLinkActive="active" [routerLinkActiveOptions]="{ exact: true }">New Interview</a>
      <a routerLink="/bank" routerLinkActive="active">Question Bank</a>
    </nav>
    <main><router-outlet /></main>
    <footer class="bar">
      <img class="logo" src="reinvented-acn-logo.svg" alt="Accenture" />
      <span><strong>Song Bench</strong> AI Initiative</span>
    </footer>
  `
})
export class App {}
