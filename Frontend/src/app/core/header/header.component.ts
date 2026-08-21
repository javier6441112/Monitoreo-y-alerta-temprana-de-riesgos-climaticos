import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterModule, MatToolbarModule, MatIconModule, MatButtonModule],
  template: `
    <mat-toolbar color="primary" class="header-toolbar">
      <span class="app-title">🌊 Monitoreo Climático</span>
      <span class="spacer"></span>
      <button mat-icon-button (click)="logout()" title="Cerrar sesión">
        <mat-icon>logout</mat-icon>
      </button>
    </mat-toolbar>
  `,
  styles: [`
    .header-toolbar {
      position: sticky;
      top: 0;
      z-index: 1000;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    .app-title {
      font-weight: 500;
      font-size: 1.2rem;
    }
    .spacer {
      flex: 1;
    }
  `]
})
export class HeaderComponent {
  logout() {
    localStorage.clear();
    window.location.href = '/login';
  }
}
