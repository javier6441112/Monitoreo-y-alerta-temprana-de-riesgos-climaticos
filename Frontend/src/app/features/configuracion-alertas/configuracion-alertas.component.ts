import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { FiltrosApi, NivelAlerta, ReglaAlerta, ReglaAlertaRequest, TipoSensor } from '../../core/models/api-contract.models';
import { ConfiguracionAlertaService } from '../../core/services/configuracion-alerta/configuracion-alerta.service';

@Component({
  selector: 'app-configuracion-alertas',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  template: `
    <section class="page-shell">
      <header class="page-head"><div><p class="eyebrow">POLÍTICAS DE RIESGO</p><h1>Reglas de alerta</h1><p>Define los rangos que activan avisos para cada tipo de sensor.</p></div><button class="button button-primary" type="button" (click)="newRule()">＋ Nueva regla</button></header>
      <form class="filters" (ngSubmit)="load()"><label>Tipo de sensor<select name="tipoSensor" [(ngModel)]="filters.tipoSensor"><option value="">Todos</option>@for (type of types; track type) {<option [value]="type">{{ type }}</option>}</select></label><label>Estado<select name="activo" [(ngModel)]="filters.activo"><option value="">Todos</option><option value="true">Activas</option><option value="false">Inactivas</option></select></label><button class="button button-secondary" type="submit">Filtrar</button><button class="button button-quiet" type="button" (click)="clear()">Limpiar</button></form>
      @if (error) { <div class="notice" role="alert">{{ error }}</div> }
      @if (loading) { <p class="state">Cargando reglas…</p> }
      @if (!loading && !error && rules.length === 0) { <div class="empty"><h2>No hay reglas para mostrar</h2><p>Configura umbrales cuando la API esté conectada.</p></div> }
      @if (!loading && rules.length) { <div class="table-wrap"><table class="data-table"><thead><tr><th>Regla</th><th>Sensor</th><th>Rango</th><th>Nivel</th><th>Fenómeno</th><th>Estado</th><th>Acciones</th></tr></thead><tbody>@for (rule of rules; track rule.id) {<tr><td><strong>{{ rule.nombre || rule.fenomeno }}</strong><small>{{ rule.mensaje }}</small></td><td>{{ rule.tipoSensor }}</td><td>{{ rule.valorMinimo ?? '—' }} a {{ rule.valorMaximo ?? '—' }}</td><td><span class="level" [class]="'level-' + rule.nivel.toLowerCase()">{{ rule.nivel }}</span></td><td>{{ rule.fenomeno }}</td><td><span class="status" [class.off]="!rule.activo">{{ rule.activo ? 'Activa' : 'Inactiva' }}</span></td><td class="actions"><button class="button button-quiet" type="button" (click)="edit(rule)">Editar</button><button class="button button-quiet" type="button" (click)="toggle(rule)">{{ rule.activo ? 'Desactivar' : 'Activar' }}</button><button class="button button-danger" type="button" (click)="remove(rule)">Eliminar</button></td></tr>}</tbody></table></div> }
      @if (editing) { <div class="backdrop" (click)="cancel()"><section class="panel" role="dialog" aria-modal="true" aria-labelledby="rule-title" (click)="$event.stopPropagation()"><header><div><p class="eyebrow">UMBRALES</p><h2 id="rule-title">{{ editingId ? 'Editar regla' : 'Crear regla' }}</h2></div><button class="close" type="button" aria-label="Cerrar" (click)="cancel()">×</button></header><form [formGroup]="form" (ngSubmit)="save()"><label>Nombre<input formControlName="nombre"></label><label>Tipo de sensor<select formControlName="tipoSensor">@for (type of types; track type) {<option [value]="type">{{ type }}</option>}</select></label><div class="limits"><label>Valor mínimo<input type="number" step="any" formControlName="valorMinimo" placeholder="Sin límite"></label><label>Valor máximo<input type="number" step="any" formControlName="valorMaximo" placeholder="Sin límite"></label></div>@if (limitsInvalid) {<p class="validation">Ingresa al menos un límite y verifica que el mínimo no supere el máximo.</p>}<label>Nivel de riesgo<select formControlName="nivel">@for (level of levels; track level) {<option [value]="level">{{ level }}</option>}</select></label><label>Fenómeno<input formControlName="fenomeno" placeholder="INUNDACION"></label><label>Mensaje<textarea rows="3" formControlName="mensaje"></textarea></label>@if (editingId) {<label class="checkbox"><input type="checkbox" formControlName="activo"> Regla activa</label>}@if (formError) {<p class="notice">{{ formError }}</p>}<footer><button class="button button-secondary" type="button" (click)="cancel()">Cancelar</button><button class="button button-primary" type="submit" [disabled]="form.invalid || limitsInvalid || saving">{{ saving ? 'Guardando…' : 'Guardar regla' }}</button></footer></form></section></div> }
    </section>
  `,
  styles: [`
    :host{display:block}.page-shell{max-width:1440px;margin:0 auto}.page-head{display:flex;justify-content:space-between;align-items:flex-end;gap:20px;margin-bottom:24px}.page-head h1,.panel h2{margin:0;font-size:30px;color:var(--ink)}.page-head p:not(.eyebrow){margin:7px 0 0;color:var(--muted)}.eyebrow{margin:0 0 8px;color:var(--accent);font-size:11px;font-weight:700;letter-spacing:1.2px}.filters{display:flex;flex-wrap:wrap;align-items:flex-end;gap:12px;padding:16px 0;margin-bottom:12px;border-block:1px solid var(--line)}.filters label,.panel label{display:grid;flex:1 1 170px;gap:6px;color:var(--muted);font-size:12px;font-weight:600}.filters select,.panel input,.panel select,.panel textarea{min-height:40px;padding:8px 10px;border:1px solid var(--line);border-radius:4px;background:#fff;color:var(--ink);font:inherit}.panel textarea{resize:vertical}.button{min-height:38px;padding:8px 12px;border:1px solid transparent;border-radius:4px;font:inherit;font-size:12px;font-weight:650;cursor:pointer}.button:disabled{opacity:.5;cursor:not-allowed}.button-primary{background:var(--accent);color:#fff}.button-secondary{border-color:var(--line);background:#fff;color:var(--ink)}.button-quiet{background:transparent;color:var(--accent-dark)}.button-danger{background:transparent;color:var(--danger)}.table-wrap{overflow:auto;border-bottom:1px solid var(--line)}.data-table{width:100%;border-collapse:collapse;text-align:left;font-size:12px}.data-table th{padding:11px;color:var(--muted);font-size:10px;text-transform:uppercase;letter-spacing:.5px;border-bottom:1px solid var(--line);white-space:nowrap}.data-table td{padding:13px 10px;border-bottom:1px solid var(--line-soft);vertical-align:middle}.data-table small{display:block;max-width:260px;margin-top:4px;color:var(--muted);font-size:10px}.level,.status{display:inline-flex;padding:4px 7px;border-radius:3px;font-size:10px;font-weight:750}.level-verde{background:#e2f3e9;color:#176543}.level-amarillo{background:#fff1ca;color:#805b08}.level-naranja{background:#fde5d5;color:#9b481d}.level-rojo{background:#fbe1dc;color:#9d3426}.status{background:#e2f3e9;color:#176543}.status.off{background:#edf0ef;color:#626b67}.actions{white-space:nowrap}.state,.empty{padding:38px 12px;color:var(--muted);text-align:center}.empty h2{margin:0 0 6px;color:var(--ink);font-size:18px}.empty p{margin:0}.notice{padding:12px 14px;margin:16px 0;border-left:3px solid var(--danger);background:#fff1ef;color:#8f3026;font-size:13px}.backdrop{position:fixed;inset:0;z-index:20;display:flex;justify-content:flex-end;background:#122b2938}.panel{width:min(530px,100%);height:100%;overflow:auto;padding:26px;background:#fff;box-shadow:-12px 0 36px #122b291a}.panel>header{display:flex;justify-content:space-between;margin-bottom:22px}.panel h2{font-size:22px}.close{width:36px;height:36px;border:0;border-radius:4px;background:#f0f4f2;font-size:24px;cursor:pointer}.panel form{display:grid;gap:14px}.limits{display:grid;grid-template-columns:1fr 1fr;gap:12px}.validation{margin:-7px 0 0;color:var(--danger);font-size:11px}.checkbox{display:flex!important;align-items:center}.checkbox input{min-height:auto}.panel footer{display:flex;justify-content:flex-end;gap:10px;margin-top:8px}@media(max-width:700px){.page-head{align-items:flex-start;flex-direction:column}.panel{padding:20px}.limits{grid-template-columns:1fr}}
  `]
})
export class ConfiguracionAlertasComponent implements OnInit {
  rules: ReglaAlerta[] = [];
  loading = false;
  saving = false;
  error = '';
  formError = '';
  editing = false;
  editingId: number | null = null;
  filters = { tipoSensor: '', activo: '' };
  types: TipoSensor[] = ['TEMPERATURA', 'HUMEDAD', 'VIENTO', 'LLUVIA', 'NIVEL_RIO', 'RESERVORIO', 'HUMO', 'OTRO'];
  levels: NivelAlerta[] = ['ROJO', 'NARANJA', 'AMARILLO', 'VERDE'];
  form: FormGroup;

  constructor(private readonly service: ConfiguracionAlertaService, fb: FormBuilder) {
    this.form = fb.group({
      nombre: ['', Validators.required], tipoSensor: ['TEMPERATURA' as TipoSensor, Validators.required],
      valorMinimo: [null as number | null], valorMaximo: [null as number | null], nivel: ['AMARILLO' as NivelAlerta, Validators.required],
      fenomeno: ['', Validators.required], mensaje: ['', Validators.required], activo: [true]
    });
  }

  ngOnInit(): void { this.load(); }
  get limitsInvalid(): boolean {
    const { valorMinimo, valorMaximo } = this.form.getRawValue();
    return (valorMinimo === null && valorMaximo === null) || (valorMinimo !== null && valorMaximo !== null && valorMinimo > valorMaximo);
  }

  load(): void {
    this.loading = true; this.error = '';
    const filters = Object.fromEntries(Object.entries(this.filters).filter(([, value]) => value !== '')) as FiltrosApi;
    this.service.getAll(filters).subscribe({ next: data => { this.rules = data; this.loading = false; }, error: () => { this.rules = []; this.loading = false; this.error = 'No fue posible cargar reglas. Verifica que la API esté disponible.'; } });
  }
  clear(): void { this.filters = { tipoSensor: '', activo: '' }; this.load(); }
  newRule(): void { this.editingId = null; this.form.reset({ nombre: '', tipoSensor: 'TEMPERATURA', valorMinimo: null, valorMaximo: null, nivel: 'AMARILLO', fenomeno: '', mensaje: '', activo: true }); this.formError = ''; this.editing = true; }
  edit(rule: ReglaAlerta): void { this.editingId = rule.id; this.form.reset({ ...rule, valorMinimo: rule.valorMinimo, valorMaximo: rule.valorMaximo }); this.formError = ''; this.editing = true; }
  cancel(): void { this.editing = false; }

  save(): void {
    if (this.form.invalid || this.limitsInvalid || this.saving) return;
    const request = this.form.getRawValue() as ReglaAlertaRequest;
    this.saving = true; this.formError = '';
    const operation = this.editingId ? this.service.update(this.editingId, request) : this.service.create(request);
    operation.subscribe({ next: () => { this.saving = false; this.editing = false; this.load(); }, error: () => { this.saving = false; this.formError = 'No se pudo guardar la regla. Revisa los umbrales y la conexión con la API.'; } });
  }
  toggle(rule: ReglaAlerta): void { this.service.setActive(rule.id, !rule.activo).subscribe({ next: () => this.load(), error: () => this.error = 'No se pudo cambiar el estado de la regla.' }); }
  remove(rule: ReglaAlerta): void {
    if (!confirm(`¿Eliminar la regla ${rule.nombre || rule.fenomeno}?`)) return;
    this.service.remove(rule.id).subscribe({ next: () => this.load(), error: () => this.error = 'No se pudo eliminar la regla. Puede estar asociada a alertas históricas.' });
  }
}
