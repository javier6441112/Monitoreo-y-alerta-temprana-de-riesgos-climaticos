import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { AlertaService } from '../services/alerta/alerta.service';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule, MatListModule, MatIconModule],
  template: `
    <mat-nav-list class="sidebar-nav">
      <a mat-list-item routerLink="/dashboard" routerLinkActive="active">
        <mat-icon matListItemIcon>dashboard</mat-icon>
        <span matListItemTitle>Dashboard</span>
      </a>
      <a mat-list-item routerLink="/sensores" routerLinkActive="active">
        <mat-icon matListItemIcon>sensors</mat-icon>
        <span matListItemTitle>Sensores</span>
      </a>
      <a mat-list-item routerLink="/lecturas" routerLinkActive="active">
        <mat-icon matListItemIcon>show_chart</mat-icon>
        <span matListItemTitle>Lecturas</span>
      </a>
      <a mat-list-item routerLink="/alertas" routerLinkActive="active">
        <mat-icon matListItemIcon>notifications</mat-icon>
        <span matListItemTitle>Alertas</span>
        <span class="badge" *ngIf="alertasActivas > 0">{{ alertasActivas }}</span>
      </a>
      <a mat-list-item routerLink="/configuracion-alertas" routerLinkActive="active">
        <mat-icon matListItemIcon>tune</mat-icon>
        <span matListItemTitle>Configurar alertas</span>
      </a>
      <a mat-list-item routerLink="/historial" routerLinkActive="active">
        <mat-icon matListItemIcon>history</mat-icon>
        <span matListItemTitle>Historial</span>
      </a>
    </mat-nav-list>
  `,
  styles: [`
    .sidebar-nav {
      width: 250px;
      height: 100%;
      padding-top: 8px;
      background: white;
      border-right: 1px solid #e0e0e0;
    }
    .sidebar-nav a {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px 16px;
      color: #333;
      text-decoration: none;
    }
    .sidebar-nav a:hover {
      background-color: rgba(0, 0, 0, 0.04);
    }
    .sidebar-nav a.active {
      background-color: rgba(63, 81, 181, 0.08);
      color: #3f51b5;
    }
    .badge {
      background-color: #f44336;
      color: white;
      border-radius: 50%;
      padding: 2px 8px;
      font-size: 12px;
      margin-left: auto;
      min-width: 20px;
      text-align: center;
    }
  `]
})
export class SidebarComponent implements OnInit {
  alertasActivas = 0;

  constructor(private alertaService: AlertaService) {}

  ngOnInit() {
    this.loadAlertasActivas();
  }

  loadAlertasActivas() {
    this.alertaService.getAlertasActivas().subscribe(alertas => {
      this.alertasActivas = alertas.length;
    });
  }
}
