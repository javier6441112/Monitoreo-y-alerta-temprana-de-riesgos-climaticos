import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { AuthService } from '../services/auth/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterModule, MatToolbarModule, MatIconModule, MatButtonModule],
  template: `
    <mat-toolbar class="header-toolbar">
      <a class="brand" routerLink="/dashboard" aria-label="Ir al dashboard">
        <span class="brand-mark" aria-hidden="true">W</span>
        <span><strong>WeatherRisk</strong><small>Monitoreo climático</small></span>
      </a>
      <span class="spacer"></span>
      <ng-container *ngIf="auth.user$ | async as user">
        <div class="user-summary"><span class="user-name">{{ user.nombre }}</span><span class="user-role">{{ user.rol }}</span></div>
        <button mat-icon-button (click)="logout()" title="Cerrar sesión" aria-label="Cerrar sesión">
          <mat-icon>logout</mat-icon>
        </button>
      </ng-container>
    </mat-toolbar>
  `,
  styles: [`
    .header-toolbar { position:sticky;top:0;z-index:10;min-height:66px;padding:0 24px;background:#123a35;color:white;box-shadow:0 2px 8px #0f302c18; }
    .brand { display:flex;align-items:center;gap:11px;color:inherit;text-decoration:none;line-height:1.1; }
    .brand-mark { display:grid;place-items:center;width:34px;height:34px;border:1px solid #78b9aa;border-radius:4px;color:#a6e0cc;font-family:Georgia,serif;font-size:21px; }
    .brand strong,.brand small { display:block; }.brand strong { font-size:15px;letter-spacing:.4px; }.brand small { margin-top:4px;color:#b3cdc6;font-size:10px; }
    .spacer { flex:1; }.user-summary { display:grid;gap:3px;margin-right:12px;text-align:right; }.user-name { font-size:12px;font-weight:650; }.user-role { color:#b3cdc6;font-size:10px; }
    button { color:white; }
    @media(max-width:520px) { .header-toolbar { padding:0 14px; }.user-name { max-width:110px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap; } }
  `]
})
export class HeaderComponent {
  constructor(public readonly auth: AuthService, private readonly router: Router) {}

  logout(): void {
    this.auth.logout();
    void this.router.navigate(['/login']);
  }
}
