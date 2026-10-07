import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { AlertaService } from '../services/alerta/alerta.service';
import { AuthService } from '../services/auth/auth.service';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule, MatListModule, MatIconModule],
  template: `
    <nav class="sidebar-nav" aria-label="Navegación principal">
      <p class="nav-label">MONITOREO</p>
      <a routerLink="/dashboard" routerLinkActive="active"><mat-icon>space_dashboard</mat-icon><span>Dashboard</span></a>
      <a routerLink="/comunidades" routerLinkActive="active"><mat-icon>location_city</mat-icon><span>Comunidades</span></a>
      <a routerLink="/sensores" routerLinkActive="active"><mat-icon>sensors</mat-icon><span>Sensores</span></a>
      <a routerLink="/lecturas" routerLinkActive="active"><mat-icon>show_chart</mat-icon><span>Lecturas</span></a>
      <a routerLink="/alertas" routerLinkActive="active"><mat-icon>notifications</mat-icon><span>Alertas</span><span class="badge" *ngIf="alertasActivas > 0">{{ alertasActivas }}</span></a>
      <a routerLink="/historial" routerLinkActive="active"><mat-icon>history</mat-icon><span>Historial</span></a>
      <ng-container *ngIf="isAdmin">
        <p class="nav-label nav-label-admin">ADMINISTRACIÓN</p>
        <a routerLink="/configuracion-alertas" routerLinkActive="active"><mat-icon>tune</mat-icon><span>Reglas de alerta</span></a>
        <a routerLink="/usuarios" routerLinkActive="active"><mat-icon>manage_accounts</mat-icon><span>Usuarios</span></a>
        <a routerLink="/bitacora" routerLinkActive="active"><mat-icon>receipt_long</mat-icon><span>Bitácora</span></a>
      </ng-container>
    </nav>
  `,
  styles: [`
    :host { display:block;flex:0 0 228px;background:#fff;border-right:1px solid var(--line); }
    .sidebar-nav { position:sticky;top:66px;display:flex;flex-direction:column;gap:3px;padding:22px 12px; }
    .sidebar-nav a { display:flex;align-items:center;gap:11px;min-height:42px;padding:0 12px;border-radius:4px;color:#52605b;text-decoration:none;font-size:13px;font-weight:550;transition:background .16s,color .16s; }
    .sidebar-nav a:hover { background:#f1f6f4;color:var(--ink); }.sidebar-nav a.active { background:#e2f2ec;color:#126554; }
    .sidebar-nav mat-icon { width:19px;height:19px;font-size:19px;color:#74837d; }.sidebar-nav a.active mat-icon { color:#126554; }
    .nav-label { margin:0 12px 6px;color:#93a09a;font-size:9px;font-weight:750;letter-spacing:1px; }.nav-label-admin { margin-top:24px; }
    .badge { display:grid;place-items:center;min-width:20px;height:20px;margin-left:auto;border-radius:10px;background:#be4d39;color:white;font-size:10px;font-weight:700; }
    @media(max-width:800px) { :host { flex:0 0 auto;border-right:0;border-bottom:1px solid var(--line); }.sidebar-nav { position:static;display:flex;flex-direction:row;overflow-x:auto;padding:8px 12px;white-space:nowrap; }.sidebar-nav a { flex:0 0 auto;min-height:38px;padding:0 10px; }.nav-label { display:none; } }
  `]
})
export class SidebarComponent implements OnInit {
  alertasActivas = 0;
  get isAdmin(): boolean { return this.auth.hasRole(['ADMIN']); }

  constructor(private alertaService: AlertaService, private auth: AuthService) {}

  ngOnInit() {
    this.loadAlertasActivas();
  }

  loadAlertasActivas() {
    this.alertaService.getAlertasActivas().subscribe({ next: alertas => this.alertasActivas = alertas.length, error: () => this.alertasActivas = 0 });
  }
}
