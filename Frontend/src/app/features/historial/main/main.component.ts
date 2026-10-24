import { Component, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Comunidad, EstadisticasHistorial, EventoHistorial, FiltrosApi, NivelAlerta } from '../../../core/models/api-contract.models';
import { ComunidadService } from '../../../core/services/comunidad/comunidad.service';
import { HistorialService } from '../../../core/services/historial/historial.service';

@Component({
  selector: 'app-historial-main',
  standalone: true,
  imports: [CommonModule, DatePipe, FormsModule],
  template: `
    <section class="page-shell">
      <header class="page-head"><div><p class="eyebrow">TRAZABILIDAD DE RIESGO</p><h1>Historial de eventos</h1><p>Consulta eventos climáticos por periodo, comunidad y severidad.</p></div><button class="button button-secondary" type="button" (click)="load()">Actualizar</button></header>
      <section class="stats-strip"><div><small>EVENTOS EN EL PERIODO</small><strong>{{ stats?.totalEventos ?? '—' }}</strong></div>@for (level of levels; track level.key) {<div><small>{{ level.label }}</small><strong>{{ stats?.porNivel?.[level.key] ?? '—' }}</strong></div>}</section>
      <form class="filters" (ngSubmit)="load()"><label>Desde<input type="date" name="desde" [(ngModel)]="filters.desde"></label><label>Hasta<input type="date" name="hasta" [(ngModel)]="filters.hasta"></label><label>Comunidad<select name="comunidadId" [(ngModel)]="filters.comunidadId"><option value="">Todas</option>@for (community of communities; track community.id) {<option [value]="community.id">{{ community.nombre }}</option>}</select></label><label>Fenómeno<select name="fenomeno" [(ngModel)]="filters.fenomeno"><option value="">Todos</option>@for (phenomenon of phenomena; track phenomenon) {<option [value]="phenomenon">{{ phenomenon }}</option>}</select></label><label>Nivel<select name="nivel" [(ngModel)]="filters.nivel"><option value="">Todos</option><option value="ROJO">Rojo</option><option value="NARANJA">Naranja</option><option value="AMARILLO">Amarillo</option><option value="VERDE">Verde</option></select></label><button class="button button-primary" type="submit">Aplicar filtros</button><button class="button button-quiet" type="button" (click)="clear()">Limpiar</button></form>
      @if (error) { <div class="notice" role="alert">{{ error }}</div> }
      @if (loading) { <p class="state">Cargando historial…</p> }
      @if (!loading && !error && events.length === 0) { <div class="empty"><h2>No hay eventos para estos filtros</h2><p>Los eventos de riesgo se mostrarán cuando existan registros.</p></div> }
      @if (!loading && events.length) { <div class="table-wrap"><table class="data-table"><thead><tr><th>Fecha y hora</th><th>Fenómeno</th><th>Nivel</th><th>Comunidad</th><th>Sensor</th><th>Valor</th><th>Detalle</th></tr></thead><tbody>@for (event of events; track event.id) {<tr><td>{{ event.fechaHora | date:'medium' }}</td><td><strong>{{ event.fenomeno }}</strong></td><td><span class="level" [class]="'level-' + event.nivel.toLowerCase()">{{ event.nivel }}</span></td><td>{{ event.comunidadNombre || communityName(event.comunidadId) }}</td><td>{{ event.sensorNombre || 'Sensor ' + event.sensorId }}</td><td>{{ event.valor ?? '—' }}</td><td class="message">{{ event.mensaje }}</td></tr>}</tbody></table></div> }
    </section>
  `,
  styles: [`
    :host{display:block}.page-shell{max-width:1440px;margin:0 auto}.page-head{display:flex;justify-content:space-between;align-items:flex-end;gap:20px;margin-bottom:22px}.page-head h1{margin:0;font-size:30px;color:var(--ink)}.page-head p:not(.eyebrow){margin:7px 0 0;color:var(--muted)}.eyebrow{margin:0 0 8px;color:var(--accent);font-size:11px;font-weight:700;letter-spacing:1.2px}.button{min-height:38px;padding:8px 12px;border:1px solid transparent;border-radius:4px;font:inherit;font-size:12px;font-weight:650;cursor:pointer}.button-primary{background:var(--accent);color:white}.button-secondary{border-color:var(--line);background:white;color:var(--ink)}.button-quiet{background:transparent;color:var(--accent-dark)}.stats-strip{display:grid;grid-template-columns:repeat(5,1fr);margin-bottom:14px;border:1px solid var(--line);background:white}.stats-strip div{display:grid;gap:7px;padding:13px 15px;border-right:1px solid var(--line-soft)}.stats-strip div:last-child{border:0}.stats-strip small{color:var(--muted);font-size:9px;font-weight:750;letter-spacing:.5px}.stats-strip strong{font-size:21px;color:var(--ink)}.filters{display:flex;flex-wrap:wrap;align-items:flex-end;gap:10px;padding:16px 0;margin-bottom:12px;border-block:1px solid var(--line)}.filters label{display:grid;flex:1 1 140px;gap:6px;color:var(--muted);font-size:11px;font-weight:650}.filters input,.filters select{box-sizing:border-box;width:100%;min-height:39px;padding:8px;border:1px solid var(--line);border-radius:4px;background:white;color:var(--ink);font:inherit;font-size:12px}.table-wrap{overflow:auto;border-bottom:1px solid var(--line)}.data-table{width:100%;border-collapse:collapse;text-align:left;font-size:12px}.data-table th{padding:11px 10px;color:var(--muted);font-size:10px;text-transform:uppercase;letter-spacing:.5px;border-bottom:1px solid var(--line);white-space:nowrap}.data-table td{padding:13px 10px;border-bottom:1px solid var(--line-soft);vertical-align:top}.level{display:inline-flex;padding:4px 7px;border-radius:3px;font-size:10px;font-weight:750}.level-verde{background:#e2f3e9;color:#176543}.level-amarillo{background:#fff1ca;color:#805b08}.level-naranja{background:#fde5d5;color:#9b481d}.level-rojo{background:#fbe1dc;color:#9d3426}.message{min-width:180px;max-width:320px;color:#53625c}.notice{padding:12px 14px;margin:16px 0;border-left:3px solid var(--danger);background:#fff1ef;color:#8f3026;font-size:13px}.state,.empty{padding:38px 12px;color:var(--muted);text-align:center}.empty h2{margin:0 0 6px;color:var(--ink);font-size:18px}.empty p{margin:0}@media(max-width:700px){.page-head{align-items:flex-start;flex-direction:column}.stats-strip{grid-template-columns:repeat(2,1fr)}.stats-strip div:nth-child(2n){border-right:0}.stats-strip div:last-child{border-right:0}}
  `]
})
export class MainComponent implements OnInit {
  events: EventoHistorial[] = [];
  communities: Comunidad[] = [];
  stats: EstadisticasHistorial | null = null;
  loading = false;
  error = '';
  filters: FiltrosApi = { desde: '', hasta: '', comunidadId: '', sensorId: '', fenomeno: '', nivel: '' };
  levels: { key: NivelAlerta; label: string }[] = [{ key: 'ROJO', label: 'Emergencia' }, { key: 'NARANJA', label: 'Alerta' }, { key: 'AMARILLO', label: 'Precaución' }, { key: 'VERDE', label: 'Normal' }];
  phenomena = ['INUNDACION', 'SEQUIA', 'TORMENTA', 'HELADA', 'INCENDIO_FORESTAL'];

  constructor(private readonly historyService: HistorialService, private readonly communityService: ComunidadService) {}
  ngOnInit(): void {
    this.communityService.getAll().subscribe({ next: data => this.communities = data, error: () => this.communities = [] });
    this.load();
  }
  load(): void {
    this.loading = true; this.error = '';
    const filters = Object.fromEntries(Object.entries(this.filters).filter(([, value]) => value !== '')) as FiltrosApi;
    this.historyService.getHistorial(filters).subscribe({ next: data => { this.events = data; this.loading = false; }, error: () => { this.events = []; this.loading = false; this.error = 'No fue posible cargar el historial. Verifica que la API esté disponible.'; } });
    this.historyService.getStatistics(filters).subscribe({ next: data => this.stats = data, error: () => this.stats = null });
  }
  clear(): void { this.filters = { desde: '', hasta: '', comunidadId: '', sensorId: '', fenomeno: '', nivel: '' }; this.load(); }
  communityName(id: number): string { return this.communities.find(item => item.id === id)?.nombre ?? (id ? `Comunidad ${id}` : '—'); }
}
