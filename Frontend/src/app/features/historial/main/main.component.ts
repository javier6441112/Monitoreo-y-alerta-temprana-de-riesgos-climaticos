import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatPaginatorModule } from '@angular/material/paginator';
import { HistorialService, HistorialEvent } from '../../../core/services/historial/historial.service';

@Component({
  selector: 'app-historial-main',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatTableModule,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatPaginatorModule
  ],
  template: `
    <div class="historial-container">
      <div class="header">
        <h1>📜 Historial de Eventos</h1>
        <button mat-raised-button color="primary" (click)="loadHistorial()">
          <mat-icon>refresh</mat-icon> Actualizar
        </button>
      </div>

      <!-- Filtros -->
      <mat-card class="filters-card">
        <mat-card-content>
          <form [formGroup]="filterForm" class="filters-form">
            <mat-form-field appearance="outline" class="filter-field">
              <mat-label>Fenómeno</mat-label>
              <mat-select formControlName="fenomeno">
                <mat-option value="">Todos</mat-option>
                <mat-option value="INUNDACION">Inundación</mat-option>
                <mat-option value="SEQUIA">Sequía</mat-option>
                <mat-option value="TORMENTA">Tormenta</mat-option>
                <mat-option value="HELADA">Helada</mat-option>
                <mat-option value="INCENDIO_FORESTAL">Incendio Forestal</mat-option>
              </mat-select>
            </mat-form-field>

            <mat-form-field appearance="outline" class="filter-field">
              <mat-label>Nivel</mat-label>
              <mat-select formControlName="nivel">
                <mat-option value="">Todos</mat-option>
                <mat-option value="VERDE">Verde</mat-option>
                <mat-option value="AMARILLO">Amarillo</mat-option>
                <mat-option value="NARANJA">Naranja</mat-option>
                <mat-option value="ROJO">Rojo</mat-option>
              </mat-select>
            </mat-form-field>

            <mat-form-field appearance="outline" class="filter-field">
              <mat-label>Sensor ID</mat-label>
              <input matInput type="number" formControlName="sensorId" placeholder="Ej: 1">
            </mat-form-field>

            <button mat-raised-button color="primary" (click)="applyFilters()" [disabled]="filterForm.invalid">
              <mat-icon>search</mat-icon> Filtrar
            </button>
            <button mat-button (click)="clearFilters()">
              <mat-icon>clear</mat-icon> Limpiar
            </button>
          </form>
        </mat-card-content>
      </mat-card>

      <!-- Tabla de Historial -->
      <mat-card class="table-card">
        <mat-card-content>
          <div class="table-container">
            <table mat-table [dataSource]="filteredEventos" class="mat-elevation-z8">
              <!-- ID Column -->
              <ng-container matColumnDef="id">
                <th mat-header-cell *matHeaderCellDef> # </th>
                <td mat-cell *matCellDef="let evento"> {{ evento.id }} </td>
              </ng-container>

              <!-- Fecha/Hora Column -->
              <ng-container matColumnDef="fechaHora">
                <th mat-header-cell *matHeaderCellDef> Fecha/Hora </th>
                <td mat-cell *matCellDef="let evento"> 
                  {{ evento.fechaHora | date:'medium' }}
                </td>
              </ng-container>

              <!-- Fenómeno Column -->
              <ng-container matColumnDef="fenomeno">
                <th mat-header-cell *matHeaderCellDef> Fenómeno </th>
                <td mat-cell *matCellDef="let evento"> 
                  <span class="badge fenomeno">{{ evento.fenomeno }}</span>
                </td>
              </ng-container>

              <!-- Nivel Column -->
              <ng-container matColumnDef="nivel">
                <th mat-header-cell *matHeaderCellDef> Nivel </th>
                <td mat-cell *matCellDef="let evento">
                  <span class="badge nivel" [class]="'nivel-' + evento.nivel.toLowerCase()">
                    {{ evento.nivel }}
                  </span>
                </td>
              </ng-container>

              <!-- Mensaje Column -->
              <ng-container matColumnDef="mensaje">
                <th mat-header-cell *matHeaderCellDef> Mensaje </th>
                <td mat-cell *matCellDef="let evento"> {{ evento.mensaje }} </td>
              </ng-container>

              <!-- Sensor ID Column -->
              <ng-container matColumnDef="sensorId">
                <th mat-header-cell *matHeaderCellDef> Sensor ID </th>
                <td mat-cell *matCellDef="let evento"> 
                  <button mat-button color="primary" (click)="filterBySensor(evento.sensorId)">
                    {{ evento.sensorId }}
                  </button>
                </td>
              </ng-container>

              <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
              <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
            </table>
          </div>

          <div *ngIf="filteredEventos.length === 0" class="empty-state">
            <mat-icon>history</mat-icon>
            <h2>No hay eventos</h2>
            <p>No se encontraron eventos con los filtros seleccionados</p>
          </div>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .historial-container {
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
    .filters-card {
      margin-bottom: 24px;
      padding: 16px;
    }
    .filters-form {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 16px;
    }
    .filter-field {
      flex: 1;
      min-width: 150px;
      max-width: 250px;
    }
    .table-card {
      padding: 16px;
    }
    .table-container {
      overflow-x: auto;
    }
    table {
      width: 100%;
    }
    .badge {
      padding: 4px 12px;
      border-radius: 16px;
      font-size: 12px;
      font-weight: 500;
    }
    .badge.fenomeno {
      background: #e3f2fd;
      color: #1976d2;
    }
    .badge.nivel {
      color: white;
    }
    .badge.nivel-verde { background: #4caf50; }
    .badge.nivel-amarillo { background: #ffc107; color: #333; }
    .badge.nivel-naranja { background: #ff9800; }
    .badge.nivel-rojo { background: #f44336; }
    .empty-state {
      text-align: center;
      padding: 40px 20px;
      color: #666;
    }
    .empty-state mat-icon {
      font-size: 48px;
      width: 48px;
      height: 48px;
      color: #ccc;
    }
    .empty-state h2 {
      margin: 16px 0 8px;
      color: #333;
    }
    @media (max-width: 600px) {
      .filters-form {
        flex-direction: column;
      }
      .filter-field {
        max-width: 100%;
        width: 100%;
      }
    }
  `]
})
export class MainComponent implements OnInit {
  eventos: HistorialEvent[] = [];
  filteredEventos: HistorialEvent[] = [];
  displayedColumns: string[] = ['id', 'fechaHora', 'fenomeno', 'nivel', 'mensaje', 'sensorId'];
  filterForm: FormGroup;

  constructor(
    private historialService: HistorialService,
    private fb: FormBuilder
  ) {
    this.filterForm = this.fb.group({
      fenomeno: [''],
      nivel: [''],
      sensorId: ['']
    });
  }

  ngOnInit() {
    this.loadHistorial();
  }

  loadHistorial() {
    this.historialService.getHistorial().subscribe(data => {
      this.eventos = data;
      this.filteredEventos = data;
    });
  }

  applyFilters() {
    const { fenomeno, nivel, sensorId } = this.filterForm.value;
    
    this.filteredEventos = this.eventos.filter(evento => {
      let match = true;
      
      if (fenomeno && evento.fenomeno !== fenomeno) {
        match = false;
      }
      
      if (nivel && evento.nivel !== nivel) {
        match = false;
      }
      
      if (sensorId && evento.sensorId !== +sensorId) {
        match = false;
      }
      
      return match;
    });
  }

  clearFilters() {
    this.filterForm.reset({
      fenomeno: '',
      nivel: '',
      sensorId: ''
    });
    this.filteredEventos = this.eventos;
  }

  filterBySensor(sensorId: number) {
    this.filterForm.patchValue({ sensorId });
    this.applyFilters();
  }
}
