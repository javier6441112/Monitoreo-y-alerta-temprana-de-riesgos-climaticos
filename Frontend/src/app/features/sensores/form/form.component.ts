import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { Comunidad, SensorRequest, TipoSensor } from '../../../core/models/api-contract.models';
import { ComunidadService } from '../../../core/services/comunidad/comunidad.service';
import { SensorService } from '../../../core/services/sensor/sensor.service';

@Component({
  selector: 'app-sensores-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  template: `
    <section class="form-page">
      <a class="back-link" routerLink="/sensores">← Volver a sensores</a>
      <header><p class="eyebrow">INVENTARIO DE DISPOSITIVOS</p><h1>{{ isEdit ? 'Editar sensor' : 'Registrar sensor' }}</h1><p>Identificación, ubicación y configuración de la estación de monitoreo.</p></header>
      @if (error) { <div class="notice" role="alert">{{ error }}</div> }
      @if (!communities.length && !communityLoading) { <div class="notice">No hay comunidades disponibles. Registra una comunidad antes de asociar este sensor.</div> }
      <form [formGroup]="form" (ngSubmit)="save()">
        <section class="form-section"><h2>Identificación</h2><div class="fields">
          <label>Nombre<input formControlName="nombre" placeholder="Ej. Pluviómetro zona norte"><small *ngIf="form.controls.nombre.touched && form.controls.nombre.invalid">El nombre es obligatorio.</small></label>
          <label>Código único<input formControlName="codigo" placeholder="Ej. GT-IZB-014"><small *ngIf="form.controls.codigo.touched && form.controls.codigo.invalid">El código es obligatorio.</small></label>
          <label>Tipo de sensor<select formControlName="tipo">@for (type of types; track type) {<option [value]="type">{{ type }}</option>}</select></label>
          <label>Unidad de medida<input formControlName="unidad" placeholder="°C, mm, km/h"></label>
          <label>Comunidad<select formControlName="comunidadId"><option [ngValue]="null" disabled>Seleccionar comunidad</option>@for (community of communities; track community.id) {<option [ngValue]="community.id">{{ community.nombre }} · {{ community.municipio }}</option>}</select></label>
          <label>Fecha de instalación<input type="date" formControlName="fechaInstalacion"></label>
        </div></section>
        <section class="form-section"><h2>Ubicación y notas</h2><div class="fields">
          <label>Latitud<input type="number" step="any" formControlName="latitud" placeholder="15.1234"></label>
          <label>Longitud<input type="number" step="any" formControlName="longitud" placeholder="-90.1234"></label>
          <label class="wide">Descripción<textarea rows="3" formControlName="descripcion" placeholder="Referencia del punto de instalación o condiciones del sitio"></textarea></label>
        </div><label class="toggle"><input type="checkbox" formControlName="activo"> Sensor habilitado</label></section>
        <footer><button class="button button-secondary" type="button" routerLink="/sensores">Cancelar</button><button class="button button-primary" type="submit" [disabled]="form.invalid || saving || communityLoading">{{ saving ? 'Guardando…' : (isEdit ? 'Guardar cambios' : 'Registrar sensor') }}</button></footer>
      </form>
    </section>
  `,
  styles: [`
    :host{display:block}.form-page{max-width:900px;margin:0 auto}.back-link{display:inline-block;margin-bottom:24px;color:var(--accent-dark);font-size:12px;font-weight:650;text-decoration:none}.form-page header{margin-bottom:22px}.eyebrow{margin:0 0 8px;color:var(--accent);font-size:11px;font-weight:700;letter-spacing:1.2px}h1{margin:0;font-size:29px;color:var(--ink)}.form-page header p:last-child{margin:7px 0 0;color:var(--muted)}.form-section{padding:20px 0;border-top:1px solid var(--line)}.form-section h2{margin:0 0 18px;font-size:15px;color:var(--ink)}.fields{display:grid;grid-template-columns:1fr 1fr;gap:16px}.fields label{display:grid;gap:7px;color:var(--muted);font-size:12px;font-weight:650}.fields input,.fields select,.fields textarea{box-sizing:border-box;width:100%;min-height:41px;padding:9px 10px;border:1px solid var(--line);border-radius:4px;background:white;color:var(--ink);font:inherit;font-weight:400}.fields textarea{resize:vertical}.fields small{color:var(--danger);font-size:10px}.wide{grid-column:1/-1}.toggle{display:flex;align-items:center;gap:8px;margin-top:16px;color:var(--ink);font-size:12px}.toggle input{accent-color:var(--accent)}footer{display:flex;justify-content:flex-end;gap:10px;padding-top:18px;border-top:1px solid var(--line)}.button{min-height:39px;padding:8px 14px;border:1px solid transparent;border-radius:4px;font:inherit;font-size:12px;font-weight:650;cursor:pointer}.button:disabled{opacity:.5;cursor:not-allowed}.button-primary{background:var(--accent);color:#fff}.button-secondary{border-color:var(--line);background:#fff;color:var(--ink)}.notice{padding:12px 14px;margin:16px 0;border-left:3px solid #d69a2d;background:#fff5dc;color:#805b08;font-size:12px}@media(max-width:620px){.fields{grid-template-columns:1fr}.wide{grid-column:auto}h1{font-size:25px}}
  `]
})
export class FormComponent implements OnInit {
  form: FormGroup;
  communities: Comunidad[] = [];
  types: TipoSensor[] = ['TEMPERATURA', 'HUMEDAD', 'VIENTO', 'LLUVIA', 'NIVEL_RIO', 'RESERVORIO', 'HUMO', 'OTRO'];
  sensorId: number | null = null;
  isEdit = false;
  saving = false;
  communityLoading = true;
  error = '';

  constructor(fb: FormBuilder, private readonly route: ActivatedRoute, private readonly router: Router, private readonly sensorService: SensorService, private readonly communityService: ComunidadService) {
    this.form = fb.group({
      nombre: ['', [Validators.required, Validators.maxLength(120)]],
      codigo: ['', [Validators.required, Validators.maxLength(50)]],
      tipo: ['TEMPERATURA' as TipoSensor, Validators.required],
      unidad: ['', Validators.required],
      comunidadId: [null as number | null, Validators.required],
      latitud: [null as number | null],
      longitud: [null as number | null],
      fechaInstalacion: [''],
      descripcion: [''],
      activo: [true]
    });
  }

  ngOnInit(): void {
    this.communityService.getAll({ activo: true }).subscribe({
      next: data => { this.communities = data; this.communityLoading = false; },
      error: () => { this.communities = []; this.communityLoading = false; }
    });
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (Number.isInteger(id) && id > 0) {
      this.sensorId = id;
      this.isEdit = true;
      this.sensorService.getSensor(id).subscribe({
        next: sensor => this.form.patchValue(sensor),
        error: () => this.error = 'No se pudo cargar el sensor solicitado.'
      });
    }
  }

  save(): void {
    if (this.form.invalid || this.saving) return;
    const value = this.form.getRawValue();
    const request: SensorRequest = {
      nombre: value.nombre!,
      codigo: value.codigo!,
      tipo: value.tipo!,
      unidad: value.unidad!,
      comunidadId: value.comunidadId!,
      latitud: value.latitud,
      longitud: value.longitud,
      fechaInstalacion: value.fechaInstalacion || null,
      descripcion: value.descripcion ?? '',
      activo: value.activo ?? true
    };
    this.saving = true;
    this.error = '';
    const operation = this.sensorId ? this.sensorService.updateSensor(this.sensorId, request) : this.sensorService.createSensor(request);
    operation.subscribe({
      next: () => { this.saving = false; void this.router.navigate(['/sensores']); },
      error: () => { this.saving = false; this.error = 'No se pudo guardar. Revisa el código, la comunidad y la conexión con la API.'; }
    });
  }
}
