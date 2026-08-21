import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DashboardService, DashboardData } from '../../core/services/dashboard/dashboard.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div style="padding:20px;">
      <h1>📊 Dashboard</h1>
      <p>Bienvenido al sistema de monitoreo climático</p>
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:16px;margin-top:20px;">
        <div style="background:white;padding:20px;border-radius:8px;box-shadow:0 2px 4px rgba(0,0,0,0.1);">
          <h3>🌡️ Temperatura</h3>
          <p style="font-size:24px;font-weight:bold;">{{ dashboard?.temperatura?.valor || '--' }}°C</p>
        </div>
        <div style="background:white;padding:20px;border-radius:8px;box-shadow:0 2px 4px rgba(0,0,0,0.1);">
          <h3>💧 Humedad</h3>
          <p style="font-size:24px;font-weight:bold;">{{ dashboard?.humedad?.valor || '--' }}%</p>
        </div>
        <div style="background:white;padding:20px;border-radius:8px;box-shadow:0 2px 4px rgba(0,0,0,0.1);">
          <h3>🌊 Nivel Río</h3>
          <p style="font-size:24px;font-weight:bold;">{{ dashboard?.nivelRio?.valor || '--' }}m</p>
        </div>
        <div style="background:white;padding:20px;border-radius:8px;box-shadow:0 2px 4px rgba(0,0,0,0.1);">
          <h3>⚠️ Alertas Activas</h3>
          <p style="font-size:24px;font-weight:bold;color:#f44336;">{{ dashboard?.alertasActivas || 0 }}</p>
        </div>
        <div style="background:white;padding:20px;border-radius:8px;box-shadow:0 2px 4px rgba(0,0,0,0.1);">
          <h3>📡 Sensores Activos</h3>
          <p style="font-size:24px;font-weight:bold;color:#4caf50;">{{ dashboard?.sensoresActivos || 0 }}</p>
        </div>
        <div style="background:white;padding:20px;border-radius:8px;box-shadow:0 2px 4px rgba(0,0,0,0.1);">
          <h3>🎯 Nivel General</h3>
          <p style="font-size:24px;font-weight:bold;" [style.color]="getNivelColor(dashboard?.nivelGeneral)">
            {{ dashboard?.nivelGeneral || '--' }}
          </p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; }
    h1 { color: #1a237e; margin-bottom: 8px; }
    h3 { color: #555; margin: 0 0 8px 0; font-size: 14px; font-weight: 500; }
    p { margin: 0; }
  `]
})
export class DashboardComponent implements OnInit {
  dashboard: DashboardData | null = null;

  constructor(private dashboardService: DashboardService) {}

  ngOnInit() {
    this.loadDashboard();
  }

  loadDashboard() {
    this.dashboardService.getDashboard().subscribe(data => {
      this.dashboard = data;
    });
  }

  getNivelColor(nivel?: string): string {
    switch (nivel) {
      case 'VERDE': return '#4caf50';
      case 'AMARILLO': return '#ffc107';
      case 'NARANJA': return '#ff9800';
      case 'ROJO': return '#f44336';
      default: return '#333';
    }
  }
}
