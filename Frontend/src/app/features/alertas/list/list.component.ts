import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { AlertaService, Alerta } from '../../../core/services/alerta/alerta.service';

@Component({
  selector: 'app-alertas-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatSnackBarModule
  ],
  template: `
    <div class="alertas-container">
      <div class="header">
        <h1>🔔 Alertas</h1>
        <div class="filters">
          <button mat-raised-button 
                  [color]="filter === 'todas' ? 'primary' : ''" 
                  (click)="filter = 'todas'">
            Todas
          </button>
          <button mat-raised-button 
                  [color]="filter === 'activas' ? 'primary' : ''" 
                  (click)="filter = 'activas'">
            Activas ({{ alertasActivas.length }})
          </button>
        </div>
      </div>

      <!-- Alertas -->
      <div class="alertas-grid">
        <mat-card *ngFor="let alerta of getFilteredAlertas()" 
                  class="alerta-card" 
                  [class]="'nivel-' + alerta.nivel.toLowerCase()">
          <mat-card-header>
            <div class="nivel-indicator" [class]="'nivel-' + alerta.nivel.toLowerCase()">
              {{ getNivelIcon(alerta.nivel) }}
            </div>
            <mat-card-title>
              <span class="fenomeno">{{ alerta.fenomeno }}</span>
              <span class="nivel-badge" [class]="'nivel-' + alerta.nivel.toLowerCase()">
                {{ alerta.nivel }}
              </span>
            </mat-card-title>
            <mat-card-subtitle>
              Sensor ID: {{ alerta.sensorId }} | 
              {{ alerta.fechaHora | date:'medium' }}
            </mat-card-subtitle>
          </mat-card-header>
          
          <mat-card-content>
            <p class="mensaje">{{ alerta.mensaje }}</p>
            <div class="detalles">
              <span><strong>Valor detectado:</strong> {{ alerta.valorDetectado }}</span>
              <span [class]="alerta.activa ? 'activa' : 'inactiva'">
                {{ alerta.activa ? '🟢 Activa' : '🔴 Cerrada' }}
              </span>
            </div>
          </mat-card-content>
          
          <mat-card-actions *ngIf="alerta.activa">
            <button mat-raised-button color="warn" (click)="cerrarAlerta(alerta.id)">
              <mat-icon>check</mat-icon>
              Cerrar Alerta
            </button>
          </mat-card-actions>
        </mat-card>
      </div>

      <!-- Sin alertas -->
      <div *ngIf="getFilteredAlertas().length === 0" class="empty-state">
        <mat-icon>notifications_off</mat-icon>
        <h2>No hay alertas</h2>
        <p>Todas las alertas han sido atendidas</p>
      </div>
    </div>
  `,
  styles: [`
    .alertas-container {
      padding: 20px;
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 24px;
    }
    .header h1 {
      margin: 0;
      color: #1a237e;
    }
    .filters {
      display: flex;
      gap: 12px;
    }
    .alertas-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
      gap: 20px;
    }
    .alerta-card {
      border-left: 6px solid #ccc;
    }
    .alerta-card.nivel-verde { border-left-color: #4caf50; }
    .alerta-card.nivel-amarillo { border-left-color: #ffc107; }
    .alerta-card.nivel-naranja { border-left-color: #ff9800; }
    .alerta-card.nivel-rojo { border-left-color: #f44336; }

    .nivel-indicator {
      font-size: 24px;
      margin-right: 12px;
    }
    .nivel-indicator.nivel-verde { color: #4caf50; }
    .nivel-indicator.nivel-amarillo { color: #ffc107; }
    .nivel-indicator.nivel-naranja { color: #ff9800; }
    .nivel-indicator.nivel-rojo { color: #f44336; }

    .fenomeno {
      font-weight: 600;
      font-size: 1.1rem;
    }
    .nivel-badge {
      padding: 4px 12px;
      border-radius: 16px;
      font-size: 12px;
      font-weight: 600;
      margin-left: 12px;
      color: white;
    }
    .nivel-badge.nivel-verde { background: #4caf50; }
    .nivel-badge.nivel-amarillo { background: #ffc107; color: #333; }
    .nivel-badge.nivel-naranja { background: #ff9800; }
    .nivel-badge.nivel-rojo { background: #f44336; }

    .mensaje {
      font-size: 1rem;
      margin: 12px 0;
      color: #444;
    }
    .detalles {
      display: flex;
      justify-content: space-between;
      font-size: 0.9rem;
      color: #666;
    }
    .activa { color: #4caf50; font-weight: 500; }
    .inactiva { color: #666; text-decoration: line-through; }

    mat-card-actions {
      padding: 8px 16px 16px;
      display: flex;
      justify-content: flex-end;
    }

    .empty-state {
      text-align: center;
      padding: 60px 20px;
      color: #666;
    }
    .empty-state mat-icon {
      font-size: 64px;
      width: 64px;
      height: 64px;
      color: #ccc;
    }
    .empty-state h2 {
      margin: 16px 0 8px;
      color: #333;
    }
  `]
})
export class ListComponent implements OnInit {
  alertas: Alerta[] = [];
  filter: 'todas' | 'activas' = 'activas';

  constructor(
    private alertaService: AlertaService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit() {
    this.loadAlertas();
  }

  loadAlertas() {
    this.alertaService.getAlertas().subscribe(data => {
      this.alertas = data;
    });
  }

  getFilteredAlertas(): Alerta[] {
    if (this.filter === 'activas') {
      return this.alertas.filter(a => a.activa);
    }
    return this.alertas;
  }

  get alertasActivas(): Alerta[] {
    return this.alertas.filter(a => a.activa);
  }

  getNivelIcon(nivel: string): string {
    const icons: { [key: string]: string } = {
      'VERDE': '✅',
      'AMARILLO': '⚠️',
      'NARANJA': '🔶',
      'ROJO': '🚨'
    };
    return icons[nivel] || '📢';
  }

  cerrarAlerta(id: number) {
    if (confirm('¿Estás seguro de cerrar esta alerta?')) {
      this.alertaService.cerrarAlerta(id).subscribe({
        next: () => {
          this.snackBar.open('Alerta cerrada correctamente', 'Cerrar', {
            duration: 3000,
            panelClass: ['success-snackbar']
          });
          this.loadAlertas();
        },
        error: () => {
          this.snackBar.open('Error al cerrar la alerta', 'Cerrar', {
            duration: 3000,
            panelClass: ['error-snackbar']
          });
        }
      });
    }
  }
}
