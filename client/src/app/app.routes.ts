import { Routes } from '@angular/router';
import { SetupComponent } from './setup.component';
import { InterviewComponent } from './interview.component';
import { ReportComponent } from './report.component';
import { BankComponent } from './bank.component';

export const routes: Routes = [
  { path: '', component: SetupComponent },
  { path: 'interview', component: InterviewComponent },
  { path: 'report', component: ReportComponent },
  { path: 'bank', component: BankComponent },
  { path: '**', redirectTo: '' }
];
