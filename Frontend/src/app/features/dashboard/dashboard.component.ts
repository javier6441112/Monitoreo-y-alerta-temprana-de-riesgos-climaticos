import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

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
          <p style="font-size:24px;font-weight:bold;">27.5°C</p>
        </div>
        <div style="background:white;padding:20px;border-radius:8px;box-shadow:0 2px 4px rgba(0,0,0,0.1);">
          <h3>💧 Humedad</h3>
          <p style="font-size:24px;font-weight:bold;">78%</p>
        </div>
        <div style="background:white;padding:20px;border-radius:8px;box-shadow:0 2px 4px rgba(0,0,0,0.1);">
          <h3>🌊 Nivel Río</h3>
          <p style="font-size:24px;font-weight:bold;">2.8m</p>
        </div>
        <div style="background:white;padding:20px;border-radius:8px;box-shadow:0 2px 4px rgba(0,0,0,0.1);">
          <h3>⚠️ Alertas</h3>
          <p style="font-size:24px;font-weight:bold;color:#f44336;">2</p>
        </div>
      </div>
    </div>
  `,
  styles: []
})
export class DashboardComponent {}
