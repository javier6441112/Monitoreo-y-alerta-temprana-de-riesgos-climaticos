import { Component, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { FiltrosApi, Sensor, TipoSensor } from '../../../core/models/api-contract.models';
import { AuthService } from '../../../core/services/auth/auth.service';
import { ComunidadService } from '../../../core/services/comunidad/comunidad.service';
import { Comunidad } from '../../../core/models/api-contract.models';
import { SensorService } from '../../../core/services/sensor/sensor.service';

@Component({
  selector: 'app-sensores-list',
  standalone: true,
  imports: [CommonModule, DatePipe, FormsModule, RouterModule],
  template: `
    <section class="page-shell">
      <header class="page-head"><div><p class="eyebrow">RED DE MONITOREO</p><h1>Sensores</h1><p>Estado operativo, ubicación y lecturas más recientes.</p></div>@if (canOperate) { <a class="button button-primary" routerLink="/sensores/nuevo">＋ Registrar sensor</a> }</header>
      <form class="filters" (ngSubmit)="load()"><label class="search-field">Código o nombre<input name="codigo" [(ngModel)]="filters.codigo" placeholder="Buscar sensor"></label><label>Comunidad<select name="comunidadId" [(ngModel)]="filters.comunidadId"><option value="">Todas</option>@for (community of communities; track community.id) {<option [value]="community.id">{{ community.nombre }}</option>}</select></label><label>Tipo<select name="tipo" [(ngModel)]="filters.tipo"><option value="">Todos</option>@for (type of types; track type) {<option [value]="type">{{ type }}</option>}</select></label><label>Estado<select name="activo" [(ngModel)]="filters.activo"><option value="">Todos</option><option value="true">Activos</option><option value="false">Inactivos</option></select></label><button class="button button-secondary" type="submit">Filtrar</button><button class="button button-quiet" type="button" (click)="clear()">Limpiar</button></form>
      @if (error) { <div class="notice" role="alert">{{ error }}</div> }
      @if (loading) { <p class="state">Cargando sensores…</p> }
      @if (!loading && !error && sensors.length === 0) { <div class="empty"><h2>No hay sensores para mostrar</h2><p>Registra un sensor cuando exista al menos una comunidad disponible.</p></div> }
      @if (!loading && sensors.length) { <div class="table-wrap"><table class="data-table"><thead><tr><th>Sensor</th><th>Tipo</th><th>Comunidad</th><th>Último valor</th><th>Ubicación</th><th>Última lectura</th><th>Estado</th>@if (canOperate) { <th>Acciones</th> }</tr></thead><tbody>@for (sensor of sensors; track sensor.id) {<tr><td><strong>{{ sensor.nombre }}</strong><small>{{ sensor.codigo || 'ID ' + sensor.id }}</small></td><td>{{ sensor.tipo }}</td><td>{{ sensor.comunidadNombre || communityName(sensor.comunidadId) }}</td><td class="value">{{ sensor.valorActual ?? '—' }} <small>{{ sensor.unidad }}</small></td><td>{{ sensor.latitud ?? '—' }}, {{ sensor.longitud ?? '—' }}</td><td>{{ sensor.ultimaLectura ? (sensor.ultimaLectura | date:'short') : 'Sin lecturas' }}</td><td><span class="status" [class.off]="!sensor.activo">{{ sensor.activo ? 'Activo' : 'Inactivo' }}</span></td>@if (canOperate) { <td class="actions"><a class="button button-quiet" [routerLink]="['/sensores/editar', sensor.id]">Editar</a><button class="button button-quiet" type="button" (click)="toggle(sensor)">{{ sensor.activo ? 'Desactivar' : 'Activar' }}</button>@if (isAdmin) { <button class="button button-danger" type="button" (click)="remove(sensor)">Eliminar</button> }</td> }</tr>}</tbody></table></div> }
    </section>
  `,
  styles: [`
    :host{display:block}.page-shell{max-width:1500px;margin:0 auto}.page-head{display:flex;justify-content:space-between;align-items:flex-end;gap:20px;margin-bottom:24px}.page-head h1{margin:0;font-size:30px;color:var(--ink)}.page-head p:not(.eyebrow){margin:7px 0 0;color:var(--muted)}.eyebrow{margin:0 0 8px;color:var(--accent);font-size:11px;font-weight:700;letter-spacing:1.2px}.filters{display:flex;flex-wrap:wrap;align-items:flex-end;gap:10px;padding:16px 0;margin-bottom:12px;border-block:1px solid var(--line)}.filters label{display:grid;flex:1 1 145px;gap:6px;color:var(--muted);font-size:11px;font-weight:650}.filters input,.filters select{box-sizing:border-box;width:100%;min-height:39px;padding:8px;border:1px solid var(--line);border-radius:4px;background:white;color:var(--ink);font:inherit;font-size:12px}.search-field{flex-basis:220px!important}.button{display:inline-flex;align-items:center;justify-content:center;min-height:36px;padding:7px 10px;border:1px solid transparent;border-radius:4px;background:transparent;color:var(--accent-dark);font:inherit;font-size:11px;font-weight:650;text-decoration:none;white-space:nowrap;cursor:pointer}.button-primary{min-height:39px;padding-inline:14px;background:var(--accent);color:white}.button-secondary{border-color:var(--line);background:white;color:var(--ink)}.button-danger{color:var(--danger)}.button-quiet:hover{background:#e8f2ee}.table-wrap{overflow:auto;border-bottom:1px solid var(--line)}.data-table{width:100%;border-collapse:collapse;text-align:left;font-size:12px}.data-table th{padding:11px 10px;color:var(--muted);font-size:10px;text-transform:uppercase;letter-spacing:.5px;border-bottom:1px solid var(--line);white-space:nowrap}.data-table td{padding:13px 10px;border-bottom:1px solid var(--line-soft);vertical-align:middle;color:var(--ink)}small{display:block;margin-top:4px;color:var(--muted);font-size:10px}.value{font-weight:700;white-space:nowrap}.value small{display:inline;font-weight:400}.status{display:inline-flex;padding:4px 7px;border-radius:3px;background:#e2f3e9;color:#176543;font-size:10px;font-weight:750}.status.off{background:#edf0ef;color:#626b67}.actions{white-space:nowrap}.notice{padding:12px 14px;margin:16px 0;border-left:3px solid var(--danger);background:#fff1ef;color:#8f3026;font-size:13px}.state,.empty{padding:38px 12px;color:var(--muted);text-align:center}.empty h2{margin:0 0 6px;color:var(--ink);font-size:18px}.empty p{margin:0}@media(max-width:740px){.page-head{align-items:flex-start;flex-direction:column}.filters label{flex-basis:125px}}
  `]
})
export class ListComponent implements OnInit {
  sensors: Sensor[] = [];
  communities: Comunidad[] = [];
  types: TipoSensor[] = ['TEMPERATURA', 'HUMEDAD', 'VIENTO', 'LLUVIA', 'NIVEL_RIO', 'RESERVORIO', 'HUMO', 'OTRO'];
  filters: FiltrosApi = { codigo: '', comunidadId: '', tipo: '', activo: '' };
  loading = false;
  error = '';
  get canOperate(): boolean { return this.auth.hasRole(['ADMIN', 'OPERADOR']); }
  get isAdmin(): boolean { return this.auth.hasRole(['ADMIN']); }

  constructor(private readonly sensorService: SensorService, private readonly communityService: ComunidadService, private readonly auth: AuthService) {}
  ngOnInit(): void {
    this.communityService.getAll().subscribe({ next: data => this.communities = data, error: () => this.communities = [] });
    this.load();
  }
  load(): void {
    this.loading = true; this.error = '';
    const filters = Object.fromEntries(Object.entries(this.filters).filter(([, value]) => value !== '')) as FiltrosApi;
    this.sensorService.getSensores(filters).subscribe({ next: data => { this.sensors = data; this.loading = false; }, error: () => { this.sensors = []; this.loading = false; this.error = 'No fue posible cargar sensores. Verifica la conexión con la API.'; } });
  }
  clear(): void { this.filters = { codigo: '', comunidadId: '', tipo: '', activo: '' }; this.load(); }
  communityName(id: number): string { return this.communities.find(item => item.id === id)?.nombre ?? `Comunidad ${id}`; }
  toggle(sensor: Sensor): void { this.sensorService.toggleSensor(sensor.id, !sensor.activo).subscribe({ next: () => this.load(), error: () => this.error = 'No se pudo cambiar el estado del sensor.' }); }
  remove(sensor: Sensor): void {
    if (!confirm(`¿Eliminar el sensor ${sensor.nombre}?`)) return;
    this.sensorService.deleteSensor(sensor.id).subscribe({ next: () => this.load(), error: () => this.error = 'No se pudo eliminar el sensor. Puede tener lecturas asociadas.' });
  }
}
