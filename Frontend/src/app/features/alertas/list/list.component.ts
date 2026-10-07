import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { Alerta, EstadoAlerta, FiltrosApi } from '../../../core/models/api-contract.models';
import { AuthService } from '../../../core/services/auth/auth.service';
import { AlertaService } from '../../../core/services/alerta/alerta.service';
import { Signalr } from '../../../core/services/signalr/signalr';

@Component({
  selector: 'app-alertas-list',
  standalone: true,
  imports: [CommonModule, FormsModule, DatePipe],
  template: `
    <section class="page-shell">
      <header class="page-head"><div><p class="eyebrow">CENTRO DE OPERACIONES</p><h1>Alertas</h1><p>Eventos detectados por las reglas de riesgo configuradas.</p></div><button class="button button-secondary" type="button" (click)="load()">Actualizar</button></header>
      <form class="filters" (ngSubmit)="load()"><label>Desde<input type="date" name="desde" [(ngModel)]="filters.desde"></label><label>Hasta<input type="date" name="hasta" [(ngModel)]="filters.hasta"></label><label>Comunidad<input type="number" name="comunidadId" [(ngModel)]="filters.comunidadId" placeholder="ID"></label><label>Sensor<input type="number" name="sensorId" [(ngModel)]="filters.sensorId" placeholder="ID"></label><label>Fenómeno<select name="fenomeno" [(ngModel)]="filters.fenomeno"><option value="">Todos</option><option value="INUNDACION">Inundación</option><option value="SEQUIA">Sequía</option><option value="TORMENTA">Tormenta</option><option value="HELADA">Helada</option><option value="INCENDIO_FORESTAL">Incendio forestal</option></select></label><label>Nivel<select name="nivel" [(ngModel)]="filters.nivel"><option value="">Todos</option><option value="ROJO">Rojo</option><option value="NARANJA">Naranja</option><option value="AMARILLO">Amarillo</option><option value="VERDE">Verde</option></select></label><label>Estado<select name="estado" [(ngModel)]="filters.estado"><option value="">Todos</option><option value="ACTIVA">Activa</option><option value="ATENDIDA">Atendida</option><option value="CERRADA">Cerrada</option></select></label><button class="button button-primary" type="submit">Filtrar</button><button class="button button-quiet" type="button" (click)="clear()">Limpiar</button></form>
      <div class="summary"><span><i class="dot dot-red"></i>{{ count('ACTIVA') }} activas</span><span><i class="dot dot-amber"></i>{{ count('ATENDIDA') }} atendidas</span><span><i class="dot dot-muted"></i>{{ count('CERRADA') }} cerradas</span></div>
      @if (error) { <div class="notice" role="alert">{{ error }}</div> }
      @if (loading) { <p class="state">Cargando alertas…</p> }
      @if (!loading && !error && alerts.length === 0) { <div class="empty"><h2>No hay alertas para estos filtros</h2><p>Las alertas aparecerán cuando la API registre eventos de riesgo.</p></div> }
      @if (!loading && alerts.length) { <div class="table-wrap"><table class="data-table"><thead><tr><th>Fecha y hora</th><th>Riesgo</th><th>Comunidad</th><th>Sensor</th><th>Lectura / umbral</th><th>Estado</th><th>Detalle</th>@if (canOperate) { <th>Acción</th> }</tr></thead><tbody>@for (alert of alerts; track alert.id) {<tr><td>{{ alert.fechaHora | date:'medium' }}</td><td><span class="level" [class]="'level-' + alert.nivel.toLowerCase()">{{ alert.nivel }}</span><small>{{ alert.fenomeno }}</small></td><td>{{ alert.comunidadNombre || (alert.comunidadId ? 'Comunidad ' + alert.comunidadId : '—') }}</td><td>{{ alert.sensorNombre || 'Sensor ' + alert.sensorId }}</td><td><strong>{{ alert.valorDetectado }}</strong><small>Min {{ alert.valorMinimo ?? '—' }} · Max {{ alert.valorMaximo ?? '—' }}</small></td><td><span class="status" [class]="'status-' + status(alert).toLowerCase()">{{ statusLabel(status(alert)) }}</span><small>{{ alert.atendidaPorNombre || alert.cerradaPorNombre || '' }}</small></td><td class="message"><details><summary>{{ alert.mensaje }}</summary><dl><dt>Regla</dt><dd>{{ alert.configuracionAlertaId || '—' }}</dd><dt>Responsable</dt><dd>{{ alert.atendidaPorNombre || alert.cerradaPorNombre || 'Sin asignar' }}</dd><dt>Fecha de atención</dt><dd>{{ alert.fechaAtencion ? (alert.fechaAtencion | date:'short') : '—' }}</dd></dl></details></td>@if (canOperate) { <td class="actions">@if (status(alert) === 'ACTIVA') { <button class="button button-quiet" type="button" (click)="setStatus(alert, 'ATENDIDA')">Atender</button> }@if (status(alert) === 'ATENDIDA') { <button class="button button-quiet" type="button" (click)="setStatus(alert, 'CERRADA')">Cerrar</button> }</td> }</tr>}</tbody></table></div> }
    </section>
  `,
  styles: [`
    :host{display:block}.page-shell{max-width:1500px;margin:0 auto}.page-head{display:flex;justify-content:space-between;align-items:flex-end;gap:20px;margin-bottom:24px}.page-head h1{margin:0;font-size:30px;color:var(--ink)}.page-head p:not(.eyebrow){margin:7px 0 0;color:var(--muted)}.eyebrow{margin:0 0 8px;color:var(--accent);font-size:11px;font-weight:700;letter-spacing:1.2px}.filters{display:flex;flex-wrap:wrap;align-items:flex-end;gap:10px;padding:16px 0;margin-bottom:15px;border-block:1px solid var(--line)}.filters label{display:grid;flex:1 1 118px;gap:6px;color:var(--muted);font-size:11px;font-weight:650}.filters input,.filters select{box-sizing:border-box;width:100%;min-height:39px;padding:8px;border:1px solid var(--line);border-radius:4px;background:white;color:var(--ink);font:inherit;font-size:12px}.button{min-height:38px;padding:8px 12px;border:1px solid transparent;border-radius:4px;font:inherit;font-size:12px;font-weight:650;cursor:pointer}.button-primary{background:var(--accent);color:white}.button-secondary{border-color:var(--line);background:#fff;color:var(--ink)}.button-quiet{background:transparent;color:var(--accent-dark)}.summary{display:flex;gap:22px;margin:17px 0;color:var(--muted);font-size:12px}.summary span{display:flex;align-items:center;gap:7px}.dot{width:8px;height:8px;border-radius:50%}.dot-red{background:#c4513c}.dot-amber{background:#d69a2d}.dot-muted{background:#89938f}.table-wrap{overflow:auto;border-bottom:1px solid var(--line)}.data-table{width:100%;border-collapse:collapse;text-align:left;font-size:12px}.data-table th{padding:11px 10px;color:var(--muted);font-size:10px;text-transform:uppercase;letter-spacing:.5px;border-bottom:1px solid var(--line);white-space:nowrap}.data-table td{padding:13px 10px;border-bottom:1px solid var(--line-soft);vertical-align:top;color:var(--ink)}small{display:block;margin-top:5px;color:var(--muted);font-size:11px}.level,.status{display:inline-flex;padding:4px 7px;border-radius:3px;font-size:10px;font-weight:750;white-space:nowrap}.level-verde{background:#e2f3e9;color:#176543}.level-amarillo{background:#fff1ca;color:#805b08}.level-naranja{background:#fde5d5;color:#9b481d}.level-rojo{background:#fbe1dc;color:#9d3426}.status-activa{background:#fbe1dc;color:#9d3426}.status-atendida{background:#fff1ca;color:#805b08}.status-cerrada{background:#edf0ef;color:#626b67}.message{min-width:170px;max-width:290px}.actions{white-space:nowrap}.notice{padding:12px 14px;margin:16px 0;border-left:3px solid var(--danger);background:#fff1ef;color:#8f3026;font-size:13px}.state,.empty{padding:38px 12px;color:var(--muted);text-align:center}.empty h2{margin:0 0 6px;color:var(--ink);font-size:18px}.empty p{margin:0}@media(max-width:760px){.page-head{align-items:flex-start;flex-direction:column}.summary{gap:12px;flex-wrap:wrap}.filters label{flex-basis:130px}}
  `]
})
export class ListComponent implements OnInit, OnDestroy {
  alerts: Alerta[] = [];
  loading = false;
  error = '';
  filters: FiltrosApi = { desde: '', hasta: '', comunidadId: '', sensorId: '', nivel: '', estado: '' };
  private readonly subscription = new Subscription();
  get canOperate(): boolean { return this.auth.hasRole(['ADMIN', 'OPERADOR']); }

  constructor(private readonly service: AlertaService, private readonly auth: AuthService, private readonly signalr: Signalr) {}
  ngOnInit(): void { this.load(); this.subscription.add(this.signalr.alertaGenerada$.subscribe(() => this.load())); }
  ngOnDestroy(): void { this.subscription.unsubscribe(); }

  load(): void {
    this.loading = true; this.error = '';
    const filters = Object.fromEntries(Object.entries(this.filters).filter(([, value]) => value !== '')) as FiltrosApi;
    this.service.getAlertas(filters).subscribe({
      next: alerts => { this.alerts = alerts.map(alert => ({ ...alert, estado: alert.estado ?? (alert.activa ? 'ACTIVA' : 'CERRADA') })); this.loading = false; },
      error: () => { this.alerts = []; this.loading = false; this.error = 'No fue posible cargar alertas. Verifica la conexión con la API.'; }
    });
  }

  clear(): void { this.filters = { desde: '', hasta: '', comunidadId: '', sensorId: '', nivel: '', estado: '' }; this.load(); }
  status(alert: Alerta): EstadoAlerta { return alert.estado ?? (alert.activa ? 'ACTIVA' : 'CERRADA'); }
  statusLabel(status: EstadoAlerta): string { return ({ ACTIVA: 'Activa', ATENDIDA: 'Atendida', CERRADA: 'Cerrada' })[status]; }
  count(status: EstadoAlerta): number { return this.alerts.filter(alert => this.status(alert) === status).length; }

  setStatus(alert: Alerta, estado: EstadoAlerta): void {
    this.service.setStatus(alert.id, estado).subscribe({
      next: updated => { this.alerts = this.alerts.map(current => current.id === alert.id ? { ...current, ...updated } : current); },
      error: () => this.error = `No se pudo cambiar la alerta a ${this.statusLabel(estado).toLowerCase()}.`
    });
  }
}
