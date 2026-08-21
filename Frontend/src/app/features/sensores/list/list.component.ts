import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { SensorService, Sensor } from '../../../core/services/sensor/sensor.service';

@Component({
  selector: 'app-sensores-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatSlideToggleModule,
    MatSnackBarModule
  ],
  template: `
    <div class="sensores-container">
      <div class="header">
        <h1>📡 Sensores</h1>
        <button mat-raised-button color="primary" routerLink="/sensores/nuevo">
          <mat-icon>add</mat-icon> Nuevo Sensor
        </button>
      </div>

      <div class="table-container">
        <table mat-table [dataSource]="sensores" class="mat-elevation-z8">
          <!-- ID Column -->
          <ng-container matColumnDef="id">
            <th mat-header-cell *matHeaderCellDef> ID </th>
            <td mat-cell *matCellDef="let sensor"> {{ sensor.id }} </td>
          </ng-container>

          <!-- Nombre Column -->
          <ng-container matColumnDef="nombre">
            <th mat-header-cell *matHeaderCellDef> Nombre </th>
            <td mat-cell *matCellDef="let sensor"> {{ sensor.nombre }} </td>
          </ng-container>

          <!-- Tipo Column -->
          <ng-container matColumnDef="tipo">
            <th mat-header-cell *matHeaderCellDef> Tipo </th>
            <td mat-cell *matCellDef="let sensor"> 
              <span class="badge" [class]="sensor.tipo.toLowerCase()">
                {{ sensor.tipo }}
              </span>
            </td>
          </ng-container>

          <!-- Valor Actual Column -->
          <ng-container matColumnDef="valorActual">
            <th mat-header-cell *matHeaderCellDef> Valor Actual </th>
            <td mat-cell *matCellDef="let sensor"> 
              {{ sensor.valorActual }} {{ sensor.unidad }}
            </td>
          </ng-container>

          <!-- Estado Column -->
          <ng-container matColumnDef="activo">
            <th mat-header-cell *matHeaderCellDef> Estado </th>
            <td mat-cell *matCellDef="let sensor">
              <mat-slide-toggle
                [checked]="sensor.activo"
                (change)="toggleSensor(sensor.id, $event.checked)"
                color="primary">
                {{ sensor.activo ? 'Activo' : 'Inactivo' }}
              </mat-slide-toggle>
            </td>
          </ng-container>

          <!-- Última Lectura Column -->
          <ng-container matColumnDef="ultimaLectura">
            <th mat-header-cell *matHeaderCellDef> Última Lectura </th>
            <td mat-cell *matCellDef="let sensor"> 
              {{ sensor.ultimaLectura | date:'short' || 'N/A' }}
            </td>
          </ng-container>

          <!-- Actions Column -->
          <ng-container matColumnDef="acciones">
            <th mat-header-cell *matHeaderCellDef> Acciones </th>
            <td mat-cell *matCellDef="let sensor">
              <button mat-icon-button color="primary" [routerLink]="['/sensores/editar', sensor.id]">
                <mat-icon>edit</mat-icon>
              </button>
              <button mat-icon-button color="warn" (click)="deleteSensor(sensor.id)">
                <mat-icon>delete</mat-icon>
              </button>
            </td>
          </ng-container>

          <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
          <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
        </table>
      </div>
    </div>
  `,
  styles: [`
    .sensores-container {
      padding: 20px;
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
    }
    .header h1 {
      margin: 0;
      color: #1a237e;
    }
    .table-container {
      overflow-x: auto;
    }
    table {
      width: 100%;
    }
    .badge {
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 12px;
      font-weight: 500;
    }
    .badge.temperatura { background: #ff5722; color: white; }
    .badge.humedad { background: #2196f3; color: white; }
    .badge.viento { background: #4caf50; color: white; }
    .badge.lluvia { background: #00bcd4; color: white; }
    .badge.nivel_rio { background: #3f51b5; color: white; }
  `]
})
export class ListComponent implements OnInit {
  sensores: Sensor[] = [];
  displayedColumns: string[] = ['id', 'nombre', 'tipo', 'valorActual', 'activo', 'ultimaLectura', 'acciones'];

  constructor(
    private sensorService: SensorService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit() {
    this.loadSensores();
  }

  loadSensores() {
    this.sensorService.getSensores().subscribe(data => {
      this.sensores = data;
    });
  }

  toggleSensor(id: number, activo: boolean) {
    this.sensorService.toggleSensor(id, activo).subscribe({
      next: () => {
        this.snackBar.open(`Sensor ${activo ? 'activado' : 'desactivado'} correctamente`, 'Cerrar', {
          duration: 3000
        });
        this.loadSensores();
      },
      error: () => {
        this.snackBar.open('Error al cambiar el estado del sensor', 'Cerrar', {
          duration: 3000
        });
      }
    });
  }

  deleteSensor(id: number) {
    if (confirm('¿Estás seguro de eliminar este sensor?')) {
      this.sensorService.deleteSensor(id).subscribe({
        next: () => {
          this.snackBar.open('Sensor eliminado correctamente', 'Cerrar', {
            duration: 3000
          });
          this.loadSensores();
        },
        error: () => {
          this.snackBar.open('Error al eliminar el sensor', 'Cerrar', {
            duration: 3000
          });
        }
      });
    }
  }
}
