import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { FormsModule } from '@angular/forms';
import { Comunidad, ComunidadRequest } from '../../core/models/api-contract.models';
import { AuthService } from '../../core/services/auth/auth.service';
import { ComunidadService } from '../../core/services/comunidad/comunidad.service';

@Component({
  selector: 'app-comunidades',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  template: `
    <section class="page-shell">
      <header class="page-head">
        <div><p class="eyebrow">ADMINISTRACIÓN TERRITORIAL</p><h1>Comunidades</h1><p>Ubicaciones y cobertura de sensores.</p></div>
        @if (canManage) { <button class="button button-primary" type="button" (click)="newCommunity()">＋ Nueva comunidad</button> }
      </header>
      <form class="filters" (ngSubmit)="load()">
        <label class="search-field">Buscar comunidad<input name="buscar" [(ngModel)]="filters.buscar" placeholder="Nombre, municipio o departamento"></label>
        <label>Municipio<input name="municipio" [(ngModel)]="filters.municipio"></label>
        <label>Departamento<input name="departamento" [(ngModel)]="filters.departamento"></label>
        <label>Estado<select name="activo" [(ngModel)]="filters.activo"><option value="">Todos</option><option value="true">Activas</option><option value="false">Inactivas</option></select></label>
        <button class="button button-secondary" type="submit">Aplicar filtros</button>
        <button class="button button-quiet" type="button" (click)="clearFilters()">Limpiar</button>
      </form>
      @if (error) { <div class="notice notice-error" role="alert">{{ error }}</div> }
      @if (loading) { <p class="state-message">Cargando comunidades…</p> }
      @if (!loading && !error && communities.length === 0) { <div class="empty-state"><h2>No hay comunidades para mostrar</h2><p>Cuando el backend esté conectado, aquí aparecerán los registros.</p></div> }
      @if (!loading && communities.length > 0) {
        <div class="table-wrap"><table class="data-table"><thead><tr><th>Comunidad</th><th>Municipio / departamento</th><th>Ubicación</th><th>Sensores</th><th>Estado</th>@if (canManage) { <th>Acciones</th> }</tr></thead>
        <tbody>@for (item of communities; track item.id) {
          <tr><td><strong>{{ item.nombre }}</strong><small>{{ item.pais }}</small></td><td>{{ item.municipio }}<small>{{ item.departamento }}</small></td><td>{{ item.latitud ?? '—' }}, {{ item.longitud ?? '—' }}</td><td>{{ item.sensoresActivos }} activos / {{ item.sensoresTotales }} total</td><td><span class="status" [class.status-off]="!item.activo">{{ item.activo ? 'Activa' : 'Inactiva' }}</span></td>
          @if (canManage) { <td class="row-actions"><button class="button button-quiet" type="button" (click)="edit(item)">Editar</button><button class="button button-quiet" type="button" (click)="setActive(item)">{{ item.activo ? 'Desactivar' : 'Activar' }}</button></td> }</tr>
        }</tbody></table></div>
      }
      @if (editing) {
        <div class="dialog-backdrop" (click)="cancel()"><section class="editor-panel" role="dialog" aria-modal="true" aria-labelledby="community-editor-title" (click)="$event.stopPropagation()">
          <header><div><p class="eyebrow">REGISTRO</p><h2 id="community-editor-title">{{ editingId ? 'Editar comunidad' : 'Nueva comunidad' }}</h2></div><button class="icon-button" type="button" aria-label="Cerrar" (click)="cancel()">×</button></header>
          <form [formGroup]="form" (ngSubmit)="save()">
            <div class="form-grid"><label>Nombre<input formControlName="nombre" autocomplete="off"></label><label>Municipio<input formControlName="municipio"></label><label>Departamento<input formControlName="departamento"></label><label>País<input formControlName="pais"></label><label>Latitud<input type="number" step="any" formControlName="latitud"></label><label>Longitud<input type="number" step="any" formControlName="longitud"></label><label class="span-two">Descripción<textarea rows="3" formControlName="descripcion"></textarea></label><label class="check-field"><input type="checkbox" formControlName="activo"> Comunidad activa</label></div>
            @if (formError) { <p class="notice notice-error">{{ formError }}</p> }
            <footer><button class="button button-secondary" type="button" (click)="cancel()">Cancelar</button><button class="button button-primary" type="submit" [disabled]="form.invalid || saving">{{ saving ? 'Guardando…' : 'Guardar comunidad' }}</button></footer>
          </form>
        </section></div>
      }
    </section>
  `,
  styles: [`
    :host { display:block; }.page-shell { max-width:1440px; margin:0 auto; }.page-head { display:flex; justify-content:space-between; align-items:flex-end; gap:20px; margin-bottom:24px; }.page-head h1,.editor-panel h2 { margin:0; font-size:30px; color:var(--ink); }.page-head p:not(.eyebrow) { margin:7px 0 0; color:var(--muted); }.eyebrow { margin:0 0 8px; color:var(--accent); font-size:11px; font-weight:700; letter-spacing:1.2px; }.filters { display:flex; flex-wrap:wrap; align-items:flex-end; gap:12px; padding:16px 0; margin-bottom:12px; border-top:1px solid var(--line); border-bottom:1px solid var(--line); }.filters label,.form-grid label { display:grid; gap:6px; color:var(--muted); font-size:12px; font-weight:600; }.filters input,.filters select,.form-grid input,.form-grid textarea { min-height:40px; padding:8px 10px; border:1px solid var(--line); border-radius:4px; color:var(--ink); background:#fff; font:inherit; }.search-field { flex:1 1 230px; }.filters label:not(.search-field) { flex:0 1 170px; }.button { min-height:38px; padding:8px 12px; border:1px solid transparent; border-radius:4px; font:inherit; font-size:13px; font-weight:650; cursor:pointer; }.button:disabled { opacity:.55; cursor:not-allowed; }.button-primary { background:var(--accent); color:white; }.button-secondary { border-color:var(--line); background:white; color:var(--ink); }.button-quiet { background:transparent; color:var(--accent-dark); }.table-wrap { overflow:auto; border-bottom:1px solid var(--line); }.data-table { width:100%; border-collapse:collapse; text-align:left; font-size:13px; }.data-table th { padding:12px; color:var(--muted); font-size:11px; text-transform:uppercase; letter-spacing:.5px; border-bottom:1px solid var(--line); white-space:nowrap; }.data-table td { padding:14px 12px; color:var(--ink); border-bottom:1px solid var(--line-soft); }.data-table small { display:block; margin-top:4px; color:var(--muted); }.status { display:inline-flex; padding:4px 8px; background:#e0f2e9; color:#16633d; border-radius:3px; font-size:11px; font-weight:700; }.status-off { background:#edf0ef; color:#636b68; }.row-actions { white-space:nowrap; }.notice { padding:12px 14px; border-left:3px solid; margin:16px 0; font-size:13px; }.notice-error { border-color:var(--danger); background:#fff1ef; color:#8f3026; }.state-message,.empty-state { padding:38px 12px; color:var(--muted); text-align:center; }.empty-state h2 { margin:0 0 6px; color:var(--ink); font-size:18px; }.empty-state p { margin:0; }.dialog-backdrop { position:fixed; inset:0; z-index:20; display:flex; justify-content:flex-end; background:#122b2938; }.editor-panel { width:min(590px,100%); height:100%; overflow:auto; padding:26px; background:white; box-shadow:-12px 0 36px #122b291a; }.editor-panel>header { display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:22px; }.editor-panel h2 { font-size:22px; }.icon-button { width:36px; height:36px; border:0; border-radius:4px; background:#f0f4f2; font-size:24px; cursor:pointer; }.form-grid { display:grid; grid-template-columns:1fr 1fr; gap:14px; }.form-grid label { color:var(--ink); }.span-two { grid-column:1/-1; }.check-field { display:flex!important; align-items:center; }.check-field input { min-height:auto; }.editor-panel footer { display:flex; justify-content:flex-end; gap:10px; margin-top:24px; }.editor-panel textarea { resize:vertical; }
    @media(max-width:760px) { .page-head { align-items:flex-start; flex-direction:column; }.filters label:not(.search-field) { flex:1 1 135px; }.form-grid { grid-template-columns:1fr; }.span-two { grid-column:auto; }.editor-panel { padding:20px; } }
  `]
})
export class ComunidadesComponent implements OnInit {
  communities: Comunidad[] = [];
  loading = false;
  saving = false;
  error = '';
  formError = '';
  editing = false;
  editingId: number | null = null;
  filters = { buscar: '', municipio: '', departamento: '', activo: '' };
  form!: FormGroup;

  get canManage(): boolean { return this.auth.hasRole(['ADMIN']); }

  constructor(private readonly service: ComunidadService, private readonly auth: AuthService, fb: FormBuilder) {
    this.form = fb.group({
      nombre: ['', Validators.required], municipio: ['', Validators.required], departamento: ['', Validators.required],
      pais: ['Guatemala', Validators.required], latitud: [null as number | null], longitud: [null as number | null],
      descripcion: [''], activo: [true]
    });
  }

  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading = true;
    this.error = '';
    this.service.getAll(this.filters).subscribe({
      next: data => { this.communities = data; this.loading = false; },
      error: () => { this.communities = []; this.error = 'No fue posible cargar comunidades. Verifica que la API esté disponible.'; this.loading = false; }
    });
  }

  clearFilters(): void { this.filters = { buscar: '', municipio: '', departamento: '', activo: '' }; this.load(); }
  newCommunity(): void { this.editingId = null; this.form.reset({ nombre: '', municipio: '', departamento: '', pais: 'Guatemala', latitud: null, longitud: null, descripcion: '', activo: true }); this.formError = ''; this.editing = true; }
  edit(item: Comunidad): void { this.editingId = item.id; this.form.patchValue(item); this.formError = ''; this.editing = true; }
  cancel(): void { this.editing = false; }

  save(): void {
    if (this.form.invalid || this.saving) return;
    this.saving = true;
    this.formError = '';
    const request = this.form.getRawValue() as ComunidadRequest;
    const operation = this.editingId ? this.service.update(this.editingId, request) : this.service.create(request);
    operation.subscribe({
      next: () => { this.saving = false; this.editing = false; this.load(); },
      error: () => { this.saving = false; this.formError = 'No se pudo guardar. Revisa los datos o la conexión con la API.'; }
    });
  }

  setActive(item: Comunidad): void {
    this.service.setActive(item.id, !item.activo).subscribe({ next: () => this.load(), error: () => this.error = 'No se pudo cambiar el estado de la comunidad.' });
  }
}
