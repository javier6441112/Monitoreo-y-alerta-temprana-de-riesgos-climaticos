import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatIconModule } from '@angular/material/icon';
import { SensorService, Sensor } from '../../../core/services/sensor/sensor.service';

@Component({
  selector: 'app-sensores-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatSnackBarModule,
    MatIconModule
  ],
  template: `
    <div class="form-container">
      <mat-card>
        <mat-card-header>
          <mat-card-title>
            <h1>{{ isEdit ? '✏️ Editar Sensor' : '📡 Nuevo Sensor' }}</h1>
          </mat-card-title>
        </mat-card-header>
        
        <mat-card-content>
          <form [formGroup]="sensorForm" (ngSubmit)="onSubmit()">
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Nombre</mat-label>
              <input matInput formControlName="nombre" placeholder="Ej: Sensor Temperatura 01">
              <mat-error *ngIf="sensorForm.get('nombre')?.hasError('required')">
                El nombre es requerido
              </mat-error>
            </mat-form-field>

            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Tipo de Sensor</mat-label>
              <mat-select formControlName="tipo">
                <mat-option value="TEMPERATURA">Temperatura</mat-option>
                <mat-option value="HUMEDAD">Humedad</mat-option>
                <mat-option value="VIENTO">Viento</mat-option>
                <mat-option value="LLUVIA">Lluvia</mat-option>
                <mat-option value="NIVEL_RIO">Nivel de Río</mat-option>
              </mat-select>
              <mat-error *ngIf="sensorForm.get('tipo')?.hasError('required')">
                El tipo es requerido
              </mat-error>
            </mat-form-field>

            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Unidad</mat-label>
              <input matInput formControlName="unidad" placeholder="Ej: °C, m, km/h">
              <mat-error *ngIf="sensorForm.get('unidad')?.hasError('required')">
                La unidad es requerida
              </mat-error>
            </mat-form-field>

            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Comunidad ID</mat-label>
              <input matInput type="number" formControlName="comunidadId" placeholder="Ej: 1">
              <mat-error *ngIf="sensorForm.get('comunidadId')?.hasError('required')">
                La comunidad es requerida
              </mat-error>
            </mat-form-field>

            <div class="form-actions">
              <button mat-button type="button" routerLink="/sensores">Cancelar</button>
              <button mat-raised-button color="primary" type="submit" [disabled]="sensorForm.invalid">
                <mat-icon>{{ isEdit ? 'save' : 'add' }}</mat-icon>
                {{ isEdit ? 'Actualizar' : 'Crear' }}
              </button>
            </div>
          </form>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .form-container {
      max-width: 600px;
      margin: 20px auto;
    }
    .full-width {
      width: 100%;
      margin-bottom: 16px;
    }
    .form-actions {
      display: flex;
      justify-content: flex-end;
      gap: 12px;
      margin-top: 20px;
    }
    h1 {
      color: #1a237e;
      margin: 0;
    }
  `]
})
export class FormComponent implements OnInit {
  sensorForm: FormGroup;
  isEdit = false;
  sensorId: number | null = null;

  constructor(
    private fb: FormBuilder,
    private sensorService: SensorService,
    private route: ActivatedRoute,
    private router: Router,
    private snackBar: MatSnackBar
  ) {
    this.sensorForm = this.fb.group({
      nombre: ['', Validators.required],
      tipo: ['', Validators.required],
      unidad: ['', Validators.required],
      comunidadId: [1, Validators.required]
    });
  }

  ngOnInit() {
    this.route.params.subscribe(params => {
      if (params['id']) {
        this.isEdit = true;
        this.sensorId = +params['id'];
        this.loadSensor();
      }
    });
  }

  loadSensor() {
    if (this.sensorId) {
      this.sensorService.getSensor(this.sensorId).subscribe(sensor => {
        if (sensor) {
          this.sensorForm.patchValue({
            nombre: sensor.nombre,
            tipo: sensor.tipo,
            unidad: sensor.unidad,
            comunidadId: sensor.comunidadId
          });
        }
      });
    }
  }

  onSubmit() {
    if (this.sensorForm.invalid) return;

    const sensorData = this.sensorForm.value;

    if (this.isEdit && this.sensorId) {
      this.sensorService.updateSensor(this.sensorId, sensorData).subscribe({
        next: () => {
          this.snackBar.open('Sensor actualizado correctamente', 'Cerrar', { duration: 3000 });
          this.router.navigate(['/sensores']);
        },
        error: () => {
          this.snackBar.open('Error al actualizar el sensor', 'Cerrar', { duration: 3000 });
        }
      });
    } else {
      this.sensorService.createSensor(sensorData).subscribe({
        next: () => {
          this.snackBar.open('Sensor creado correctamente', 'Cerrar', { duration: 3000 });
          this.router.navigate(['/sensores']);
        },
        error: () => {
          this.snackBar.open('Error al crear el sensor', 'Cerrar', { duration: 3000 });
        }
      });
    }
  }
}
