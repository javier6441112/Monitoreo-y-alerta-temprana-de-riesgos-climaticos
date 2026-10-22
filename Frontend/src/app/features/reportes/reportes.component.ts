import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Comunidad, Sensor } from '../../core/models/api-contract.models';
import { ReporteService, ReportMetadata, ReportType } from '../../core/services/reporte/reporte.service';

@Component({
  selector: 'app-reportes', standalone: true, imports: [CommonModule, FormsModule],
  template: `
    <header><h1>Reportes</h1><p>Consulta la información climática y descarga documentos PDF.</p></header>
    <form (ngSubmit)="generate()">
      <label>Reporte<select name="type" [(ngModel)]="type">
        <option *ngFor="let item of types" [value]="item.value">{{item.label}}</option>
      </select></label>
      <label>Comunidad<select name="community" [(ngModel)]="communityId" (ngModelChange)="loadSensors()">
        <option value="">Todas</option><option *ngFor="let c of communities" [value]="c.id">{{c.nombre}}</option>
      </select></label>
      <label *ngIf="supports('sensor')">Sensor<select name="sensor" [(ngModel)]="sensorId">
        <option value="">Todos</option><option *ngFor="let s of sensors" [value]="s.id">{{s.codigo}} · {{s.nombre}}</option>
      </select></label>
      <label *ngIf="supports('dates')">Desde<input type="datetime-local" name="from" [(ngModel)]="from"></label>
      <label *ngIf="supports('dates')">Hasta<input type="datetime-local" name="to" [(ngModel)]="to"></label>
      <label *ngIf="supports('type')">Tipo de sensor<select name="sensorType" [(ngModel)]="sensorType">
        <option value="">Todos</option><option *ngFor="let t of sensorTypes" [value]="t">{{t}}</option>
      </select></label>
      <label *ngIf="supports('alerts')">Fenómeno<select name="phenomenon" [(ngModel)]="phenomenon">
        <option value="">Todos</option><option *ngFor="let item of phenomena" [value]="item">{{item}}</option>
      </select></label>
      <label *ngIf="supports('alerts')">Nivel<select name="level" [(ngModel)]="level">
        <option value="">Todos</option><option *ngFor="let item of levels" [value]="item">{{item}}</option>
      </select></label>
      <button type="submit" [disabled]="busy">{{busy ? 'Generando…' : 'Generar PDF'}}</button>
    </form>
    <p role="alert" class="error" *ngIf="error">{{error}}</p><p role="status" *ngIf="message">{{message}}</p>
    <section><div class="history-head"><h2>Historial de reportes</h2><button type="button" (click)="loadHistory()">Actualizar</button></div>
      <div class="table-wrap"><table><thead><tr><th>Reporte</th><th>Fecha</th><th>Usuario</th><th>Filtros</th><th>Estado</th><th>Última descarga</th><th></th></tr></thead>
      <tbody><tr *ngFor="let report of reports">
        <td>{{label(report.type)}}</td><td>{{report.generatedAt | date:'short'}}</td><td>{{report.generatedByName}}</td>
        <td><small>{{report.filters | json}}</small></td><td>{{statusLabel(report.status)}}</td>
        <td>{{report.downloadedAt ? (report.downloadedAt | date:'short') : 'Sin descargas'}}</td>
        <td><button type="button" [disabled]="report.status !== 'COMPLETED' || downloading" (click)="download(report)">Descargar PDF</button></td>
      </tr><tr *ngIf="!reports.length"><td colspan="7">Todavía no hay reportes.</td></tr></tbody></table></div>
      <footer><button (click)="loadHistory(page-1)" [disabled]="page<=1">Anterior</button><span>Página {{page}} · {{total}} reportes</span><button (click)="loadHistory(page+1)" [disabled]="page*20>=total">Siguiente</button></footer>
    </section>
  `,
  styles: [`
    :host{display:block;color:var(--ink,#16352d)}header p{color:var(--muted,#52675f)}
    form{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:16px;padding:20px;background:white;border:1px solid var(--line,#cadbd5)}
    label{display:flex;flex-direction:column;gap:6px;font-size:13px}select,input,button{font:inherit;padding:10px;border:1px solid #cadbd5;border-radius:4px}
    button{background:#168a74;color:white;cursor:pointer}button:disabled{opacity:.5;cursor:default}form button{align-self:end}
    section{margin-top:24px;background:white;padding:20px;border:1px solid #cadbd5}.history-head,footer{display:flex;align-items:center;justify-content:space-between;gap:12px}
    .table-wrap{overflow:auto}table{width:100%;border-collapse:collapse;font-size:12px}th,td{padding:12px 8px;border-bottom:1px solid #e1eae5;text-align:left}footer{margin-top:16px}.error{color:#a32c28}
  `]
})
export class ReportesComponent implements OnInit {
  types: {value: ReportType; label: string}[] = [
    {value:'COMMUNITIES',label:'Comunidades'},{value:'SENSORS',label:'Sensores'},{value:'READINGS',label:'Lecturas'},
    {value:'ALERTS',label:'Alertas'},{value:'EVENTS',label:'Historial de eventos'},{value:'SENSOR_STATUS',label:'Estado de sensores'},
    {value:'CLIMATE_STATISTICS',label:'Estadísticas climáticas'},{value:'EXECUTIVE',label:'Reporte ejecutivo'}
  ];
  sensorTypes = ['TEMPERATURA','HUMEDAD','VIENTO','LLUVIA','NIVEL_RIO','RESERVORIO','HUMO','OTRO'];
  phenomena = ['INUNDACION','SEQUIA','TORMENTA','HELADA','INCENDIO_FORESTAL'];
  levels = ['VERDE','AMARILLO','NARANJA','ROJO'];
  phenomenon = ''; level = '';
  type: ReportType = 'COMMUNITIES';
  communityId = ''; sensorId = ''; sensorType = ''; from = ''; to = '';
  communities: Comunidad[] = []; sensors: Sensor[] = []; reports: ReportMetadata[] = [];
  busy = false; downloading = false; error = ''; message = ''; page = 1; total = 0;
  constructor(private readonly service: ReporteService, private readonly http: HttpClient) {}
  ngOnInit() {
    this.http.get<Comunidad[]>(environment.apiUrl+'/comunidades').subscribe({
      next: rows => this.communities=rows, error: () => this.error='No se pudieron cargar las comunidades.'
    });
    this.loadSensors(); this.loadHistory();
  }
  loadSensors() {
    this.sensorId='';
    this.http.get<Sensor[]>(environment.apiUrl+'/sensores', {params:this.communityId ? {comunidadId:this.communityId} : {}}).subscribe({
      next: rows=>this.sensors=rows,error:()=>this.error='No se pudieron cargar los sensores.'
    });
  }
  generate() {
    this.error=''; this.message='';
    if (this.supports('dates') && this.from && this.to && this.from>this.to) { this.error='La fecha inicial debe ser anterior a la final.'; return; }
    const filters: Record<string,unknown> = {};
    if(this.communityId) filters['comunidadId']=Number(this.communityId);
    if(this.supports('sensor') && this.sensorId) filters['sensorId']=Number(this.sensorId);
    if(this.supports('type') && this.sensorType) filters['tipo']=this.sensorType;
    if(this.supports('dates') && this.from) filters['desde']=new Date(this.from).toISOString();
    if(this.supports('dates') && this.to) filters['hasta']=new Date(this.to).toISOString();
    if(this.supports('alerts') && this.phenomenon) filters['fenomeno']=this.phenomenon;
    if(this.supports('alerts') && this.level) filters['nivel']=this.level;
    this.busy=true;
    this.service.generate(this.type,filters).subscribe({
      next: report=>{this.busy=false;this.message=report.status==='COMPLETED'?'El PDF está listo para descargar.':'Consulta el estado en el historial.';this.loadHistory(1);},
      error: error=>{this.busy=false;this.error=typeof error.error?.detail==='string'?error.error.detail:'No se pudo generar el reporte. Revisa los filtros y el historial.';this.loadHistory(1);}
    });
  }
  loadHistory(page=this.page) {
    this.service.history(page).subscribe({next: result=>{this.reports=result.items;this.page=result.page;this.total=result.total;},
      error:()=>this.error='No se pudo consultar el historial de reportes.'});
  }
  download(report: ReportMetadata) {
    this.downloading=true;this.error='';
    this.service.download(report.id).subscribe({next: blob=>{
      const url=URL.createObjectURL(blob);const anchor=document.createElement('a');anchor.href=url;anchor.download=report.fileName;anchor.click();
      setTimeout(()=>URL.revokeObjectURL(url),1000);this.downloading=false;this.loadHistory();
    },error:()=>{this.downloading=false;this.error='No se pudo descargar el PDF. Verifica tus permisos.';}});
  }
  label(type: ReportType) { return this.types.find(item=>item.value===type)?.label ?? type; }
  supports(filter:string) {
    if(filter==='sensor') return this.type!=='COMMUNITIES';
    if(filter==='dates') return ['READINGS','ALERTS','EVENTS','CLIMATE_STATISTICS','EXECUTIVE'].includes(this.type);
    if(filter==='type') return ['SENSORS','READINGS','SENSOR_STATUS','CLIMATE_STATISTICS'].includes(this.type);
    return ['ALERTS','EVENTS'].includes(this.type);
  }
  statusLabel(status:string) { return ({GENERATING:'Generando',COMPLETED:'Completado',FAILED:'Fallido'} as Record<string,string>)[status] ?? status; }
}
