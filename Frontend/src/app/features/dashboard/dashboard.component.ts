import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { FormsModule } from '@angular/forms';
import { DashboardService, DashboardData } from '../../core/services/dashboard/dashboard.service';
import { ComunidadService } from '../../core/services/comunidad/comunidad.service';
import { Comunidad, NivelAlerta, SerieLectura } from '../../core/models/api-contract.models';
import { Signalr } from '../../core/services/signalr/signalr';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <section class="dashboard-page">
      <header class="page-head"><div><p class="eyebrow">VIGILANCIA EN TIEMPO REAL</p><h1>Estado del territorio</h1><p>Lecturas, sensores y alertas climáticas.</p></div><label class="community-filter">Comunidad<select [(ngModel)]="comunidadId" (ngModelChange)="loadDashboard()"><option value="">Todas las comunidades</option>@for (item of communities; track item.id) { <option [value]="item.id">{{ item.nombre }}</option> }</select></label></header>
      @if (error) { <div class="notice" role="alert">{{ error }}</div> }
      @if (loading) { <p class="state-message">Actualizando indicadores…</p> }
      @if (dashboard) {
        <section class="risk-strip" [class]="'risk-' + dashboard.nivelGeneral.toLowerCase()"><span class="risk-indicator"></span><div><small>NIVEL GENERAL DE RIESGO</small><strong>{{ dashboard.nivelGeneral }}</strong></div><span class="risk-note">Basado en las alertas activas de la selección actual</span></section>
        <section class="metrics-grid" aria-label="Indicadores climáticos">
          <article class="metric"><div class="metric-top"><span>Temperatura</span><span class="metric-mark mark-red">T</span></div><strong>{{ dashboard.temperatura?.valor ?? '—' }}<small>{{ dashboard.temperatura?.unidad }}</small></strong><span class="metric-foot">Último valor registrado</span></article>
          <article class="metric"><div class="metric-top"><span>Humedad</span><span class="metric-mark mark-blue">H</span></div><strong>{{ dashboard.humedad?.valor ?? '—' }}<small>{{ dashboard.humedad?.unidad }}</small></strong><span class="metric-foot">Último valor registrado</span></article>
          <article class="metric"><div class="metric-top"><span>Viento</span><span class="metric-mark mark-green">V</span></div><strong>{{ dashboard.viento?.valor ?? '—' }}<small>{{ dashboard.viento?.unidad }}</small></strong><span class="metric-foot">Último valor registrado</span></article>
          <article class="metric"><div class="metric-top"><span>Lluvia</span><span class="metric-mark mark-cyan">L</span></div><strong>{{ dashboard.lluvia?.valor ?? '—' }}<small>{{ dashboard.lluvia?.unidad }}</small></strong><span class="metric-foot">Último valor registrado</span></article>
          <article class="metric"><div class="metric-top"><span>Nivel de río</span><span class="metric-mark mark-blue">R</span></div><strong>{{ dashboard.nivelRio?.valor ?? '—' }}<small>{{ dashboard.nivelRio?.unidad }}</small></strong><span class="metric-foot">Último valor registrado</span></article>
        </section>
        <section class="overview-grid">
          <div class="data-section"><header><div><h2>Alertas por nivel</h2><p>Distribución de eventos activos</p></div><a routerLink="/alertas">Ver alertas</a></header><div class="level-list">@for (level of levels; track level.key) { <div class="level-row"><span>{{ level.label }}</span><div class="level-track"><i [class]="'bar-' + level.key.toLowerCase()" [style.width.%]="levelWidth(level.key)"></i></div><strong>{{ dashboard.alertasPorNivel?.[level.key] ?? 0 }}</strong></div> }</div><div class="stat-line"><span>Alertas activas</span><strong>{{ dashboard.alertasActivas }}</strong><span>Sensores activos</span><strong>{{ dashboard.sensoresActivos }}</strong></div></div>
          <div class="data-section"><header><div><h2>Cobertura</h2><p>Infraestructura monitoreada</p></div><a routerLink="/sensores">Ver sensores</a></header><div class="coverage"><div><strong>{{ dashboard.comunidades ?? communities.length }}</strong><span>Comunidades</span></div><div><strong>{{ dashboard.sensoresActivos }}</strong><span>Sensores activos</span></div><div><strong>{{ dashboard.sensoresInactivos ?? (dashboard.sensoresTotales - dashboard.sensoresActivos) }}</strong><span>Sensores inactivos</span></div></div><div class="coverage-bar"><i [style.width.%]="sensorCoverage"></i></div><small class="coverage-caption">{{ dashboard.sensoresTotales }} sensores registrados</small></div>
        </section>
        <section class="overview-grid lower-grid">
          <div class="data-section"><header><div><h2>Evolución de lecturas</h2><p>Últimos registros disponibles</p></div><a routerLink="/lecturas">Ver lecturas</a></header>@if (series.length) { <div class="chart" role="img" aria-label="Gráfico de lecturas recientes">@for (point of series; track $index) { <div class="chart-column" [title]="(point.fechaHora | date:'short') + ': ' + point.valor"><i [style.height.%]="seriesHeight(point.valor)"></i><small>{{ point.fechaHora | date:'HH:mm' }}</small></div> }</div> } @else { <div class="inline-empty">No hay una serie disponible para este periodo.</div> }</div>
          <div class="data-section"><header><div><h2>Eventos recientes</h2><p>Últimos eventos registrados</p></div><a routerLink="/historial">Ver historial</a></header>@if (dashboard.eventosRecientes?.length) { <ul class="event-list">@for (event of dashboard.eventosRecientes; track event.id) { <li><span class="event-level" [class]="'event-' + event.nivel.toLowerCase()"></span><div><strong>{{ event.fenomeno }}</strong><small>{{ event.comunidadNombre || event.mensaje }}</small></div><time>{{ event.fechaHora | date:'short' }}</time></li> }</ul> } @else { <div class="inline-empty">No hay eventos recientes.</div> }</div>
        </section>
      }
    </section>
  `,
  styles: [`
    :host{display:block}.dashboard-page{max-width:1500px;margin:0 auto}.page-head{display:flex;justify-content:space-between;align-items:flex-end;gap:20px;margin-bottom:22px}.page-head h1{margin:0;font-size:30px;color:var(--ink)}.page-head p:not(.eyebrow){margin:7px 0 0;color:var(--muted)}.eyebrow{margin:0 0 8px;color:var(--accent);font-size:11px;font-weight:700;letter-spacing:1.2px}.community-filter{display:grid;gap:6px;color:var(--muted);font-size:11px;font-weight:700}.community-filter select{min-width:210px;min-height:39px;padding:8px 32px 8px 10px;border:1px solid var(--line);border-radius:4px;background:white;color:var(--ink);font:inherit}.risk-strip{display:flex;align-items:center;gap:14px;padding:14px 18px;margin-bottom:15px;border-left:4px solid #278256;background:#e8f4ec}.risk-indicator{width:10px;height:10px;border-radius:50%;background:#278256}.risk-strip div{display:grid;gap:2px}.risk-strip small{font-size:9px;font-weight:750;letter-spacing:.8px}.risk-strip strong{font-size:15px}.risk-note{margin-left:auto;color:var(--muted);font-size:11px}.risk-amarillo{border-color:#d69a2d;background:#fff5dc}.risk-amarillo .risk-indicator{background:#d69a2d}.risk-naranja{border-color:#ca682e;background:#fff0e5}.risk-naranja .risk-indicator{background:#ca682e}.risk-rojo{border-color:#b94332;background:#fcece9}.risk-rojo .risk-indicator{background:#b94332}.metrics-grid{display:grid;grid-template-columns:repeat(5,minmax(130px,1fr));gap:1px;background:var(--line);border:1px solid var(--line);margin-bottom:16px}.metric{min-width:0;padding:16px;background:white}.metric-top{display:flex;justify-content:space-between;align-items:center;color:var(--muted);font-size:12px}.metric-mark{display:grid;place-items:center;width:25px;height:25px;border-radius:50%;font-size:11px;font-weight:750}.mark-red{background:#fae7e3;color:#ae4536}.mark-blue{background:#e5eef8;color:#426d9a}.mark-green{background:#e2f1e8;color:#34714f}.mark-cyan{background:#def1ef;color:#277b72}.metric>strong{display:block;margin-top:13px;font-size:27px;line-height:1.2;color:var(--ink)}.metric>strong small{margin-left:4px;color:var(--muted);font-size:12px;font-weight:500}.metric-foot{display:block;margin-top:7px;color:#89958f;font-size:10px}.overview-grid{display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:16px}.data-section{min-width:0;padding:17px 18px;background:#fff;border:1px solid var(--line)}.data-section>header{display:flex;justify-content:space-between;align-items:flex-start;gap:10px;margin-bottom:18px}.data-section h2{margin:0;font-size:15px;color:var(--ink)}.data-section header p{margin:4px 0 0;color:var(--muted);font-size:11px}.data-section header a{color:var(--accent-dark);font-size:11px;font-weight:650;text-decoration:none;white-space:nowrap}.level-list{display:grid;gap:13px}.level-row{display:grid;grid-template-columns:75px 1fr 24px;align-items:center;gap:10px;font-size:11px}.level-row>span{color:var(--muted)}.level-row>strong{text-align:right}.level-track{height:7px;background:#edf1ef}.level-track i{display:block;height:100%;min-width:0;background:#469768}.level-track .bar-amarillo{background:#daa638}.level-track .bar-naranja{background:#d77738}.level-track .bar-rojo{background:#bf4938}.stat-line{display:flex;align-items:center;gap:8px;padding-top:14px;margin-top:16px;border-top:1px solid var(--line-soft);color:var(--muted);font-size:10px}.stat-line strong{margin-right:auto;color:var(--ink);font-size:13px}.coverage{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin:22px 0}.coverage div{display:grid;gap:4px}.coverage strong{font-size:23px;color:var(--ink)}.coverage span,.coverage-caption{color:var(--muted);font-size:10px}.coverage-bar{height:8px;background:#edf1ef}.coverage-bar i{display:block;height:100%;background:#168a74}.coverage-caption{display:block;margin-top:8px}.chart{display:flex;align-items:flex-end;gap:9px;height:150px;padding:8px 2px 0;border-bottom:1px solid var(--line)}.chart-column{display:flex;flex:1;min-width:0;height:100%;flex-direction:column;align-items:center;justify-content:flex-end;gap:7px}.chart-column i{width:min(28px,75%);min-height:3px;background:#168a74}.chart-column small{color:var(--muted);font-size:9px;white-space:nowrap}.inline-empty{display:grid;place-items:center;min-height:112px;color:var(--muted);font-size:12px}.event-list{display:grid;gap:0;margin:0;padding:0;list-style:none}.event-list li{display:grid;grid-template-columns:9px minmax(0,1fr) auto;align-items:center;gap:10px;padding:10px 0;border-top:1px solid var(--line-soft)}.event-list li:first-child{border-top:0}.event-level{width:8px;height:8px;border-radius:50%;background:#55976c}.event-amarillo{background:#daa638}.event-naranja{background:#d77738}.event-rojo{background:#bf4938}.event-list li div{min-width:0}.event-list strong,.event-list small{display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.event-list strong{font-size:11px}.event-list small,.event-list time{margin-top:3px;color:var(--muted);font-size:10px}.state-message,.notice{padding:14px;color:var(--muted)}.notice{border-left:3px solid var(--danger);background:#fff1ef;color:#8f3026}@media(max-width:1080px){.metrics-grid{grid-template-columns:repeat(3,minmax(130px,1fr))}}@media(max-width:720px){.page-head{align-items:flex-start;flex-direction:column}.community-filter,.community-filter select{width:100%}.metrics-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.overview-grid{grid-template-columns:1fr}.risk-note{display:none}}@media(max-width:390px){.metrics-grid{grid-template-columns:1fr 1fr}.metric{padding:12px}}
  `]
})
export class DashboardComponent implements OnInit, OnDestroy {
  dashboard: DashboardData | null = null;
  communities: Comunidad[] = [];
  comunidadId = '';
  series: SerieLectura[] = [];
  loading = false;
  error = '';
  levels: { key: NivelAlerta; label: string }[] = [
    { key: 'ROJO', label: 'Emergencia' }, { key: 'NARANJA', label: 'Alerta' },
    { key: 'AMARILLO', label: 'Precaución' }, { key: 'VERDE', label: 'Normal' }
  ];

  private readonly subscriptions = new Subscription();

  constructor(private dashboardService: DashboardService, private communityService: ComunidadService, private readonly signalr: Signalr) {}

  ngOnInit() {
    this.communityService.getAll().subscribe({ next: data => this.communities = data, error: () => this.communities = [] });
    this.subscriptions.add(this.signalr.lecturaActualizada$.subscribe(() => this.loadDashboard()));
    this.subscriptions.add(this.signalr.alertaGenerada$.subscribe(() => this.loadDashboard()));
    this.loadDashboard();
  }

  ngOnDestroy(): void { this.subscriptions.unsubscribe(); }

  loadDashboard(): void {
    const filters = this.comunidadId ? { comunidadId: Number(this.comunidadId) } : {};
    this.loading = true;
    this.error = '';
    this.dashboardService.getDashboard(filters).subscribe({
      next: data => { this.dashboard = data; this.loading = false; },
      error: () => { this.dashboard = null; this.loading = false; this.error = 'No fue posible cargar el dashboard. Verifica que la API esté disponible.'; }
    });
    this.dashboardService.getSeries(filters).subscribe({ next: data => this.series = data, error: () => this.series = [] });
  }

  levelWidth(level: NivelAlerta): number {
    const counts = this.dashboard?.alertasPorNivel;
    const total = this.levels.reduce((sum, item) => sum + (counts?.[item.key] ?? 0), 0);
    return total ? ((counts?.[level] ?? 0) / total) * 100 : 0;
  }

  get sensorCoverage(): number {
    if (!this.dashboard?.sensoresTotales) return 0;
    return (this.dashboard.sensoresActivos / this.dashboard.sensoresTotales) * 100;
  }

  seriesHeight(value: number): number {
    const max = Math.max(...this.series.map(point => point.valor), 1);
    return Math.max(5, (value / max) * 100);
  }
}
