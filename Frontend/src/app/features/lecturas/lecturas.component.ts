import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTableModule } from '@angular/material/table';
import { Lectura } from '../../core/models/lectura.model';
import { Sensor, SensorService } from '../../core/services/sensor/sensor.service';
import { LecturaService } from '../../core/services/lectura/lectura.service';

@Component({
  selector: 'app-lecturas',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatSelectModule,
    MatSnackBarModule,
    MatTableModule
  ],
  template: `
    <div class="lecturas-container">
      <div class="page-header">
        <div>
          <h1>Lecturas de sensores</h1>
          <p>Registra valores para simular el monitoreo y evaluar alertas.</p>
        </div>
      </div>

      <mat-card class="register-card">
        <mat-card-header>
          <mat-card-title>Registrar lectura</mat-card-title>
          <mat-card-subtitle>El sistema guardará la lectura y evaluará automáticamente el nivel de riesgo.</mat-card-subtitle>
        </mat-card-header>
        <mat-card-content>
          <form [formGroup]="readingForm" (ngSubmit)="submit()" class="reading-form">
            <mat-form-field appearance="outline">
              <mat-label>Sensor</mat-label>
              <mat-select formControlName="sensorId" (selectionChange)="loadReadings()">
                <mat-option *ngFor="let sensor of sensores" [value]="sensor.id">
                  {{ sensor.nombre }} ({{ sensor.unidad }})
                </mat-option>
              </mat-select>
              <mat-error>Selecciona un sensor</mat-error>
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Valor</mat-label>
              <input matInput type="number" step="0.01" formControlName="valor" placeholder="Ej. 28.5">
              <span matTextSuffix>{{ selectedUnit }}</span>
              <mat-error>Ingresa un valor numérico</mat-error>
            </mat-form-field>

            <button mat-raised-button color="primary" type="submit" [disabled]="readingForm.invalid || saving">
              <mat-icon>add_chart</mat-icon>
              {{ saving ? 'Registrando...' : 'Registrar lectura' }}
            </button>
          </form>
        </mat-card-content>
      </mat-card>

      <mat-card class="history-card">
        <mat-card-header>
          <mat-card-title>Lecturas registradas</mat-card-title>
        </mat-card-header>
        <mat-card-content>
          <div class="table-wrapper">
            <table mat-table [dataSource]="lecturas">
              <ng-container matColumnDef="id">
                <th mat-header-cell *matHeaderCellDef>ID</th>
                <td mat-cell *matCellDef="let lectura">{{ lectura.id }}</td>
              </ng-container>
              <ng-container matColumnDef="sensorId">
                <th mat-header-cell *matHeaderCellDef>Sensor</th>
                <td mat-cell *matCellDef="let lectura">{{ sensorName(lectura.sensorId) }}</td>
              </ng-container>
              <ng-container matColumnDef="valor">
                <th mat-header-cell *matHeaderCellDef>Valor</th>
                <td mat-cell *matCellDef="let lectura">{{ lectura.valor }} {{ sensorUnit(lectura.sensorId) }}</td>
              </ng-container>
              <ng-container matColumnDef="fechaHora">
                <th mat-header-cell *matHeaderCellDef>Fecha y hora</th>
                <td mat-cell *matCellDef="let lectura">{{ lectura.fechaHora | date:'short' }}</td>
              </ng-container>
              <tr mat-header-row *matHeaderRowDef="columns"></tr>
              <tr mat-row *matRowDef="let row; columns: columns"></tr>
            </table>
            <p class="empty" *ngIf="!lecturas.length">No hay lecturas registradas para este sensor.</p>
          </div>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .lecturas-container { max-width: 1100px; margin: 0 auto; }
    .page-header { margin-bottom: 20px; }
    h1 { margin: 0 0 6px; color: #1a237e; }
    .page-header p { margin: 0; color: #5f6368; }
    mat-card { margin-bottom: 20px; }
    mat-card-title { color: #1a237e; }
    .reading-form { display: flex; align-items: center; gap: 16px; flex-wrap: wrap; padding-top: 16px; }
    .reading-form mat-form-field { flex: 1 1 260px; }
    .reading-form button { min-height: 56px; }
    .table-wrapper { overflow-x: auto; }
    table { width: 100%; }
    .empty { padding: 24px 0; color: #6b7280; text-align: center; }
    @media (max-width: 600px) { .lecturas-container { width: 100%; } .reading-form { display: block; } .reading-form mat-form-field, .reading-form button { width: 100%; margin-bottom: 12px; } }
  `]
})
export class LecturasComponent implements OnInit {
  sensores: Sensor[] = [];
  lecturas: Lectura[] = [];
  columns = ['id', 'sensorId', 'valor', 'fechaHora'];
  saving = false;
  selectedUnit = '';

  readingForm;

  constructor(
    private formBuilder: FormBuilder,
    private sensorService: SensorService,
    private lecturaService: LecturaService,
    private snackBar: MatSnackBar
  ) {
    this.readingForm = this.formBuilder.group({
      sensorId: [null as number | null, Validators.required],
      valor: [null as number | null, [Validators.required, Validators.pattern(/^-?\d+(\.\d+)?$/)]]
    });
  }

  ngOnInit(): void {
    this.sensorService.getSensores().subscribe({
      next: sensores => {
        this.sensores = sensores.filter(sensor => sensor.activo);
        if (this.sensores.length) {
          this.readingForm.controls.sensorId.setValue(this.sensores[0].id);
          this.updateUnit();
          this.loadReadings();
        }
      },
      error: () => this.snackBar.open('No se pudieron cargar los sensores', 'Cerrar', { duration: 3000 })
    });
  }

  loadReadings(): void {
    const sensorId = this.readingForm.controls.sensorId.value ?? undefined;
    this.updateUnit();
    this.lecturaService.getLecturas(sensorId ?? undefined).subscribe({
      next: lecturas => this.lecturas = lecturas,
      error: () => this.snackBar.open('No se pudieron cargar las lecturas', 'Cerrar', { duration: 3000 })
    });
  }

  submit(): void {
    if (this.readingForm.invalid) return;
    this.saving = true;
    const { sensorId, valor } = this.readingForm.getRawValue();
    this.lecturaService.registrarLectura({ sensorId: sensorId!, valor: valor! }).subscribe({
      next: () => {
        this.saving = false;
        this.readingForm.controls.valor.reset();
        this.loadReadings();
        this.snackBar.open('Lectura registrada correctamente', 'Cerrar', { duration: 3000 });
      },
      error: () => {
        this.saving = false;
        this.snackBar.open('No se pudo registrar la lectura', 'Cerrar', { duration: 3000 });
      }
    });
  }

  sensorName(sensorId: number): string {
    return this.sensores.find(sensor => sensor.id === sensorId)?.nombre ?? `Sensor ${sensorId}`;
  }

  sensorUnit(sensorId: number): string {
    return this.sensores.find(sensor => sensor.id === sensorId)?.unidad ?? '';
  }

  private updateUnit(): void {
    const sensorId = this.readingForm.controls.sensorId.value;
    this.selectedUnit = sensorId ? this.sensorUnit(sensorId) : '';
  }
}
