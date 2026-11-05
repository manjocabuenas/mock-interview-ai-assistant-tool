import { Injectable } from '@angular/core';

// Uses the browser's built-in Web Speech API (free, no key). Best in Chrome / Edge.
@Injectable({ providedIn: 'root' })
export class SpeechService {
  private rec: any = null;

  get sttSupported(): boolean {
    const w = window as any;
    return !!(w.SpeechRecognition || w.webkitSpeechRecognition);
  }

  speak(text: string): Promise<void> {
    return new Promise((resolve) => {
      speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.onend = () => resolve();
      u.onerror = () => resolve();
      speechSynthesis.speak(u);
    });
  }

  stopSpeaking() { speechSynthesis.cancel(); }

  startListening(base: string, onText: (t: string) => void, onEnd: () => void) {
    const w = window as any;
    const SR = w.SpeechRecognition || w.webkitSpeechRecognition;
    this.rec = new SR();
    this.rec.lang = 'en-US';
    this.rec.continuous = true;
    this.rec.interimResults = true;
    let finalText = base ? base + ' ' : '';
    this.rec.onresult = (e: any) => {
      let interim = '';
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const t = e.results[i][0].transcript;
        if (e.results[i].isFinal) finalText += t + ' '; else interim += t;
      }
      onText((finalText + interim).trim());
    };
    this.rec.onend = onEnd;
    this.rec.onerror = onEnd;
    this.rec.start();
  }

  stopListening() { this.rec?.stop(); }
}
