import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-forbidden',
  standalone: true,
  imports: [CommonModule, TranslateModule],
  template: `
    <div class="container mt-5">
      <div class="row justify-content-center">
        <div class="col-md-6 text-center">
          <h1 class="display-4">403</h1>
          <h2>{{ 'FORBIDDEN.TITLE' | translate }}</h2>
          <p class="lead">{{ 'FORBIDDEN.DESC' | translate }}</p>
          <button class="btn btn-primary" (click)="goHome()">{{ 'FORBIDDEN.BACK_HOME' | translate }}</button>
        </div>
      </div>
    </div>
  `,
  styleUrl: './forbidden.component.css'
})
export class ForbiddenComponent {
  constructor(private router: Router) {}

  goHome(): void {
    this.router.navigate(['/']);
  }
} 