import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { EventoAuditoria } from '../../core/models/api-contract.models';
import { BitacoraService } from '../../core/services/bitacora/bitacora.service';

@Component({
  selector: 'app-bitacora',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <section class="page-shell">
      <header class="page-head"><div><p class="eyebrow">TRAZABILIDAD</p><h1>Bitácora de auditoría</h1><p>Actividad administrativa registrada por el sistema.</p></div><button class="button button-secondary" type="button" (click)="load()">Actualizar</button></header>
      <form class="filters" (ngSubmit)="load()"><label>Desde<input type="date" name="desde" [(ngModel)]="filters.desde"></label><label>Hasta<input type="date" name="hasta" [(ngModel)]="filters.hasta"></label><label>Usuario ID<input type="number" name="usuarioId" [(ngModel)]="filters.usuarioId"></label><label>Acción<input name="accion" [(ngModel)]="filters.accion" placeholder="LOGIN, ALERTA_CERRADA"></label><label>Entidad<input name="entidad" [(ngModel)]="filters.entidad"></label><button class="button button-primary" type="submit">Filtrar</button><button class="button button-quiet" type="button" (click)="clear()">Limpiar</button></form>
      @if (error) { <div class="notice" role="alert">{{ error }}</div> }
      @if (loading) { <p class="state">Cargando actividad…</p> }
      @if (!loading && !error && events.length === 0) { <div class="empty"><h2>Sin actividad para estos filtros</h2><p>La bitácora aparecerá aquí cuando la API entregue registros.</p></div> }
      @if (!loading && events.length) { <div class="table-wrap"><table class="data-table"><thead><tr><th>Fecha y hora</th><th>Usuario</th><th>Acción</th><th>Entidad</th><th>Descripción</th></tr></thead><tbody>@for (event of events; track event.id) {<tr><td>{{ event.fechaHora | date:'medium' }}</td><td>{{ event.usuarioNombre || 'Sistema' }}</td><td><span class="action-tag">{{ event.accion }}</span></td><td>{{ event.entidad || '—' }}{{ event.entidadId ? ' #' + event.entidadId : '' }}</td><td>{{ event.descripcion }}</td></tr>}</tbody></table></div> }
    </section>
  `,
  styles: [`
    :host{display:block}.page-shell{max-width:1440px;margin:0 auto}.page-head{display:flex;justify-content:space-between;align-items:flex-end;gap:20px;margin-bottom:24px}.page-head h1{margin:0;font-size:30px;color:var(--ink)}.page-head p:not(.eyebrow){margin:7px 0 0;color:var(--muted)}.eyebrow{margin:0 0 8px;color:var(--accent);font-size:11px;font-weight:700;letter-spacing:1.2px}.filters{display:flex;flex-wrap:wrap;align-items:flex-end;gap:12px;padding:16px 0;margin-bottom:12px;border-block:1px solid var(--line)}.filters label{display:grid;flex:1 1 160px;gap:6px;color:var(--muted);font-size:12px;font-weight:600}.filters input{min-height:40px;padding:8px 10px;border:1px solid var(--line);border-radius:4px;color:var(--ink);background:#fff;font:inherit}.button{min-height:38px;padding:8px 12px;border:1px solid transparent;border-radius:4px;font:inherit;font-size:13px;font-weight:650;cursor:pointer}.button-primary{background:var(--accent);color:#fff}.button-secondary{border-color:var(--line);background:white;color:var(--ink)}.button-quiet{background:transparent;color:var(--accent-dark)}.table-wrap{overflow:auto;border-bottom:1px solid var(--line)}.data-table{width:100%;border-collapse:collapse;text-align:left;font-size:13px}.data-table th{padding:12px;color:var(--muted);font-size:11px;text-transform:uppercase;letter-spacing:.5px;border-bottom:1px solid var(--line);white-space:nowrap}.data-table td{padding:14px 12px;border-bottom:1px solid var(--line-soft);vertical-align:top}.action-tag{font-size:11px;font-weight:700;color:var(--accent-dark)}.notice{padding:12px 14px;margin:16px 0;border-left:3px solid var(--danger);background:#fff1ef;color:#8f3026;font-size:13px}.state,.empty{padding:38px 12px;color:var(--muted);text-align:center}.empty h2{margin:0 0 6px;color:var(--ink);font-size:18px}.empty p{margin:0}@media(max-width:700px){.page-head{align-items:flex-start;flex-direction:column}}
  `]
})
export class BitacoraComponent implements OnInit {
  events: EventoAuditoria[] = [];
  loading = false;
  error = '';
  filters = { desde: '', hasta: '', usuarioId: '', accion: '', entidad: '' };

  constructor(private readonly service: BitacoraService) {}
  ngOnInit(): void { this.load(); }
  load(): void {
    this.loading = true; this.error = '';
    this.service.getAll(this.filters).subscribe({
      next: data => { this.events = data; this.loading = false; },
      error: () => { this.events = []; this.loading = false; this.error = 'No fue posible cargar la bitácora. Se requiere acceso de administrador y una API disponible.'; }
    });
  }
  clear(): void { this.filters = { desde: '', hasta: '', usuarioId: '', accion: '', entidad: '' }; this.load(); }
}
