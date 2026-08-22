import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTableModule } from '@angular/material/table';
import { ConfiguracionAlerta, NivelAlerta } from '../../core/models/configuracion-alerta.model';
import { ConfiguracionAlertaService } from '../../core/services/configuracion-alerta/configuracion-alerta.service';

@Component({
  selector: 'app-configuracion-alertas',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatButtonModule, MatCardModule, MatFormFieldModule, MatIconModule, MatInputModule, MatSelectModule, MatSlideToggleModule, MatSnackBarModule, MatTableModule],
  template: `
    <div class="container">
      <header><div><h1>Configuración de alertas</h1><p>Define los umbrales de riesgo por sensor y color.</p></div><button mat-raised-button color="primary" (click)="newConfig()"><mat-icon>add</mat-icon>Nueva configuración</button></header>
      <mat-card *ngIf="editing" class="editor">
        <mat-card-header><mat-card-title>{{ editingId ? 'Editar configuración' : 'Crear configuración' }}</mat-card-title></mat-card-header>
        <mat-card-content><form [formGroup]="form" (ngSubmit)="save()">
          <mat-form-field appearance="outline"><mat-label>Tipo de sensor</mat-label><mat-select formControlName="tipoSensor"><mat-option *ngFor="let tipo of tipos" [value]="tipo">{{ tipo }}</mat-option></mat-select></mat-form-field>
          <mat-form-field appearance="outline"><mat-label>Nivel / color</mat-label><mat-select formControlName="nivel"><mat-option *ngFor="let nivel of niveles" [value]="nivel"><span class="dot" [class]="nivel.toLowerCase()"></span>{{ nivel }}</mat-option></mat-select></mat-form-field>
          <mat-form-field appearance="outline"><mat-label>Valor mínimo</mat-label><input matInput type="number" step="0.01" formControlName="valorMinimo"></mat-form-field>
          <mat-form-field appearance="outline"><mat-label>Fenómeno</mat-label><input matInput formControlName="fenomeno" placeholder="INUNDACION"></mat-form-field>
          <mat-form-field appearance="outline" class="wide"><mat-label>Mensaje</mat-label><input matInput formControlName="mensaje"></mat-form-field>
          <mat-slide-toggle formControlName="activo">Configuración activa</mat-slide-toggle>
          <div class="actions"><button mat-button type="button" (click)="cancel()">Cancelar</button><button mat-raised-button color="primary" type="submit" [disabled]="form.invalid || saving">Guardar</button></div>
        </form></mat-card-content>
      </mat-card>
      <mat-card><mat-card-content><table mat-table [dataSource]="configs">
        <ng-container matColumnDef="tipo"><th mat-header-cell *matHeaderCellDef>Sensor</th><td mat-cell *matCellDef="let item">{{ item.tipoSensor }}</td></ng-container>
        <ng-container matColumnDef="nivel"><th mat-header-cell *matHeaderCellDef>Nivel</th><td mat-cell *matCellDef="let item"><span class="level" [class]="item.nivel.toLowerCase()">{{ item.nivel }}</span></td></ng-container>
        <ng-container matColumnDef="valor"><th mat-header-cell *matHeaderCellDef>Desde</th><td mat-cell *matCellDef="let item">{{ item.valorMinimo }}</td></ng-container>
        <ng-container matColumnDef="fenomeno"><th mat-header-cell *matHeaderCellDef>Fenómeno</th><td mat-cell *matCellDef="let item">{{ item.fenomeno }}</td></ng-container>
        <ng-container matColumnDef="activo"><th mat-header-cell *matHeaderCellDef>Estado</th><td mat-cell *matCellDef="let item">{{ item.activo ? 'Activa' : 'Inactiva' }}</td></ng-container>
        <ng-container matColumnDef="acciones"><th mat-header-cell *matHeaderCellDef>Acciones</th><td mat-cell *matCellDef="let item"><button mat-icon-button color="primary" (click)="edit(item)" aria-label="Editar"><mat-icon>edit</mat-icon></button><button mat-icon-button color="warn" (click)="remove(item)" aria-label="Eliminar"><mat-icon>delete</mat-icon></button></td></ng-container>
        <tr mat-header-row *matHeaderRowDef="columns"></tr><tr mat-row *matRowDef="let row; columns: columns"></tr>
      </table><p *ngIf="!configs.length" class="empty">No hay configuraciones registradas.</p></mat-card-content></mat-card>
    </div>
  `,
  styles: [`
    .container { max-width: 1200px; margin: 0 auto; } header { display:flex; justify-content:space-between; align-items:center; gap:16px; margin-bottom:20px; } h1 { margin:0 0 6px; color:#1a237e; } p { margin:0; color:#687078; } mat-card { margin-bottom:20px; } form { display:flex; flex-wrap:wrap; gap:12px; padding-top:16px; } mat-form-field { flex:1 1 220px; } .wide { flex-basis:100%; } .actions { flex-basis:100%; display:flex; justify-content:flex-end; gap:10px; } table { width:100%; } .table-wrapper { overflow-x:auto; } .level { display:inline-block; min-width:82px; padding:4px 8px; border-radius:4px; text-align:center; font-weight:600; } .verde { background:#d9f2df; color:#187a32; } .amarillo { background:#fff0b3; color:#8a6800; } .naranja { background:#ffe0bf; color:#a84d00; } .rojo { background:#ffd6d6; color:#b42318; } .empty { padding:24px; text-align:center; } @media(max-width:650px){ header { align-items:flex-start; flex-direction:column; } }
  `]
})
export class ConfiguracionAlertasComponent implements OnInit {
  configs: ConfiguracionAlerta[] = [];
  editing = false;
  editingId: number | null = null;
  saving = false;
  columns = ['tipo', 'nivel', 'valor', 'fenomeno', 'activo', 'acciones'];
  tipos = ['TEMPERATURA', 'HUMEDAD', 'VIENTO', 'LLUVIA', 'NIVEL_RIO'];
  niveles: NivelAlerta[] = ['VERDE', 'AMARILLO', 'NARANJA', 'ROJO'];
  form;

  constructor(private fb: FormBuilder, private service: ConfiguracionAlertaService, private snack: MatSnackBar) {
    this.form = this.fb.group({ tipoSensor: ['', Validators.required], nivel: ['VERDE' as NivelAlerta, Validators.required], valorMinimo: [0.01, [Validators.required, Validators.min(0.01)]], fenomeno: ['', Validators.required], mensaje: ['', Validators.required], activo: [true] });
  }
  ngOnInit(): void { this.load(); }
  load(): void { this.service.getAll().subscribe({ next: data => this.configs = data, error: () => this.notify('No se pudieron cargar las configuraciones') }); }
  newConfig(): void { this.editingId = null; this.form.reset({ tipoSensor: '', nivel: 'VERDE', valorMinimo: 0.01, fenomeno: '', mensaje: '', activo: true }); this.editing = true; }
  edit(item: ConfiguracionAlerta): void { this.editingId = item.id; this.form.patchValue(item); this.editing = true; }
  cancel(): void { this.editing = false; }
  save(): void { if (this.form.invalid) return; this.saving = true; const request = this.form.getRawValue() as any; const action = this.editingId ? this.service.update(this.editingId, request) : this.service.create(request); action.subscribe({ next: () => { this.saving = false; this.editing = false; this.load(); this.notify('Configuración guardada correctamente'); }, error: () => { this.saving = false; this.notify('No se pudo guardar la configuración'); } }); }
  remove(item: ConfiguracionAlerta): void { if (!confirm(`¿Eliminar la configuración ${item.nivel} de ${item.tipoSensor}?`)) return; this.service.remove(item.id).subscribe({ next: () => { this.load(); this.notify('Configuración eliminada'); }, error: () => this.notify('No se pudo eliminar la configuración') }); }
  private notify(message: string): void { this.snack.open(message, 'Cerrar', { duration: 3000 }); }
}
